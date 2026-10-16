"""ATS scoring and suggestion orchestration."""
from __future__ import annotations

import logging
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, ValidationFailedError
from app.integrations.ai.factory import get_ai_adapter
from app.integrations.ai.ports import ATSResult, SuggestionResult
from app.models.enums import ParseStatus
from app.models.resume import ResumeVersion
from app.models.user import User
from app.repositories.ats_repo import ATSRepository
from app.repositories.job_repo import JobRepository
from app.repositories.resume_repo import ResumeRepository

logger = logging.getLogger(__name__)


class ATSService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = ATSRepository(db)
        self.resumes = ResumeRepository(db)
        self.jobs = JobRepository(db)
        self.ai = get_ai_adapter()

    # ---------- helpers ----------
    async def _load_version_for_user(self, user: User, version_id: uuid.UUID) -> ResumeVersion:
        version = await self.resumes.get_version(version_id)
        if version is None or version.user_id != user.id:
            raise NotFoundError("Resume version not found")
        return version

    async def _ensure_parsed(self, version: ResumeVersion) -> ResumeVersion:
        if version.parse_status == ParseStatus.parsed.value and version.parsed_text:
            return version
        # Auto-parse pending / failed / partial
        try:
            from app.integrations.storage.factory import get_storage

            storage = get_storage()
            with storage.open(version.storage_key) as fh:
                data = fh.read()
            text = self.ai.extract_text(data, version.content_type)
            version.parsed_text = text
            version.parsed_experience = {"items": self.ai.extract_experience(text)}
            skills = self.ai.extract_skills(text)
            await self.resumes.replace_skills(
                version_id=version.id,
                skills=[
                    {
                        "skill_name": s.name,
                        "normalized_name": s.normalized_name,
                        "category": s.category,
                        "confidence": s.confidence,
                    }
                    for s in skills
                ],
            )
            version.parse_status = ParseStatus.parsed.value
            version.parse_error = None
            await self.db.flush()
            refreshed = await self.resumes.get_version(version.id)
            assert refreshed is not None
            return refreshed
        except Exception as exc:  # noqa: BLE001
            version.parse_status = ParseStatus.failed.value
            version.parse_error = str(exc)[:1000]
            await self.db.flush()
            raise ValidationFailedError(f"Resume parsing failed: {exc}")

    # ---------- score ----------
    async def score(
        self,
        *,
        user: User,
        resume_version_id: uuid.UUID,
        job_id: uuid.UUID,
    ) -> dict:
        version = await self._load_version_for_user(user, resume_version_id)
        version = await self._ensure_parsed(version)

        job = await self.jobs.get_by_id(job_id, with_company=True)
        if job is None or not job.is_active:
            raise NotFoundError("Job not found")

        resume_skills = [s.normalized_name for s in (version.skills or [])]
        skill_categories = {
            s.normalized_name: (s.category or "other") for s in (version.skills or [])
        }

        result: ATSResult = self.ai.score(
            resume_text=version.parsed_text or "",
            resume_skills=resume_skills,
            job_title=job.title,
            job_description=job.description,
            required_skills=list(job.required_skills or []),
            keywords=list(job.keywords or []),
            skill_categories=skill_categories,
        )

        # Enforce the <80 rule at the service boundary
        if result.match_score < 80.0:
            if not result.missing_skills:
                required = {s.lower() for s in (job.required_skills or [])}
                have = {s.lower() for s in resume_skills}
                result.missing_skills = sorted(required - have)
            if not result.missing_keywords:
                keywords = {k.lower() for k in (job.keywords or [])}
                have = {s.lower() for s in resume_skills}
                result.missing_keywords = sorted(keywords - have)

        row = await self.repo.upsert(
            user_id=user.id,
            resume_version_id=version.id,
            job_id=job.id,
            match_score=result.match_score,
            keyword_score=result.keyword_score,
            semantic_score=result.semantic_score,
            missing_skills=result.missing_skills,
            missing_keywords=result.missing_keywords,
            suggestions=[],
            suggestion_source="rule_based",
            generated_by=result.generated_by,
        )
        await self.db.commit()
        response = {
            "id": str(row.id),
            "user_id": str(row.user_id),
            "resume_version_id": str(row.resume_version_id),
            "job_id": str(row.job_id),
            "match_score": row.match_score,
            "keyword_score": row.keyword_score,
            "semantic_score": row.semantic_score,
            "missing_skills": list(row.missing_skills or []),
            "missing_keywords": list(row.missing_keywords or []),
            "suggestions": list(row.suggestions or []),
            "suggestion_source": row.suggestion_source,
            "generated_by": row.generated_by,
            "below_threshold": row.match_score < 80.0,
            "created_at": row.created_at,
        }
        # Best-effort alerting (high_match / low_competition). The response is already
        # built, so a rollback inside the alert path cannot affect it.
        try:
            from app.services.alert_service import AlertService

            await AlertService(self.db).evaluate_ats_score(ats_row=row)
        except Exception as exc:  # noqa: BLE001
            await self.db.rollback()
            logger.warning("Alert evaluation after ATS score failed: %s", exc)
        return response

    # ---------- suggestions ----------
    async def suggestions(
        self,
        *,
        user: User,
        resume_version_id: uuid.UUID,
        job_id: uuid.UUID,
    ) -> SuggestionResult:
        version = await self._load_version_for_user(user, resume_version_id)
        version = await self._ensure_parsed(version)
        job = await self.jobs.get_by_id(job_id, with_company=False)
        if job is None or not job.is_active:
            raise NotFoundError("Job not found")

        stored = await self.repo.get_by_pair(resume_version_id=version.id, job_id=job.id)
        if stored is None:
            await self.score(user=user, resume_version_id=version.id, job_id=job.id)
            stored = await self.repo.get_by_pair(resume_version_id=version.id, job_id=job.id)
            assert stored is not None

        ats_result = ATSResult(
            match_score=stored.match_score,
            keyword_score=stored.keyword_score,
            semantic_score=stored.semantic_score,
            missing_skills=list(stored.missing_skills or []),
            missing_keywords=list(stored.missing_keywords or []),
            generated_by=stored.generated_by,
        )

        suggestion_result = self.ai.generate(
            ats_result=ats_result,
            resume_text=version.parsed_text or "",
            job_title=job.title,
            job_description=job.description,
        )

        stored.suggestions = list(suggestion_result.suggestions)
        stored.suggestion_source = suggestion_result.source
        await self.db.commit()

        return suggestion_result

    # ---------- list ----------
    async def list_scores(
        self, *, user: User, resume_id: uuid.UUID | None = None
    ) -> list[dict]:
        rows = await self.repo.list_for_user(user_id=user.id, resume_id=resume_id)
        return [
            {
                "id": str(r.id),
                "user_id": str(r.user_id),
                "resume_version_id": str(r.resume_version_id),
                "job_id": str(r.job_id),
                "match_score": r.match_score,
                "keyword_score": r.keyword_score,
                "semantic_score": r.semantic_score,
                "missing_skills": list(r.missing_skills or []),
                "missing_keywords": list(r.missing_keywords or []),
                "suggestions": list(r.suggestions or []),
                "suggestion_source": r.suggestion_source,
                "generated_by": r.generated_by,
                "below_threshold": r.match_score < 80.0,
                "created_at": r.created_at,
            }
            for r in rows
        ]