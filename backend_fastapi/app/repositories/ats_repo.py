"""ATS repository."""
from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ats import ATSScore


class ATSRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_pair(
        self, *, resume_version_id: uuid.UUID, job_id: uuid.UUID
    ) -> ATSScore | None:
        stmt = select(ATSScore).where(
            ATSScore.resume_version_id == resume_version_id,
            ATSScore.job_id == job_id,
        )
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def upsert(
        self,
        *,
        user_id: uuid.UUID,
        resume_version_id: uuid.UUID,
        job_id: uuid.UUID,
        match_score: float,
        keyword_score: float,
        semantic_score: float | None,
        missing_skills: list,
        missing_keywords: list,
        suggestions: list,
        suggestion_source: str,
        generated_by: str,
    ) -> ATSScore:
        existing = await self.get_by_pair(resume_version_id=resume_version_id, job_id=job_id)
        if existing is None:
            row = ATSScore(
                user_id=user_id,
                resume_version_id=resume_version_id,
                job_id=job_id,
                match_score=match_score,
                keyword_score=keyword_score,
                semantic_score=semantic_score,
                missing_skills=missing_skills,
                missing_keywords=missing_keywords,
                suggestions=suggestions,
                suggestion_source=suggestion_source,
                generated_by=generated_by,
            )
            self.db.add(row)
            await self.db.flush()
            return row
        existing.match_score = match_score
        existing.keyword_score = keyword_score
        existing.semantic_score = semantic_score
        existing.missing_skills = missing_skills
        existing.missing_keywords = missing_keywords
        existing.suggestions = suggestions
        existing.suggestion_source = suggestion_source
        existing.generated_by = generated_by
        await self.db.flush()
        return existing

    async def list_for_user(
        self, *, user_id: uuid.UUID, resume_id: uuid.UUID | None = None
    ) -> list[ATSScore]:
        stmt = select(ATSScore).where(ATSScore.user_id == user_id)
        if resume_id is not None:
            # join through resume_versions
            from app.models.resume import ResumeVersion

            stmt = stmt.join(
                ResumeVersion, ResumeVersion.id == ATSScore.resume_version_id
            ).where(ResumeVersion.resume_id == resume_id)
        stmt = stmt.order_by(ATSScore.created_at.desc())
        return list((await self.db.execute(stmt)).scalars().all())