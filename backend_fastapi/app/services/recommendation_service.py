"""Recommendation service — the ranking pipeline with local fallback."""
from __future__ import annotations

import logging
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.integrations.ai.factory import get_ai_adapter
from app.integrations.ai.ports import RankedJob
from app.models.user import User
from app.repositories.job_repo import JobRepository
from app.repositories.recommendation_repo import RecommendationRepository
from app.repositories.resume_repo import ResumeRepository
from app.repositories.swipe_repo import SwipeRepository
from app.repositories.user_repo import UserRepository
from app.services.competition_service import freshness

logger = logging.getLogger(__name__)


class RecommendationService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.jobs = JobRepository(db)
        self.swipes = SwipeRepository(db)
        self.resumes = ResumeRepository(db)
        self.users = UserRepository(db)
        self.events = RecommendationRepository(db)
        self.ai = get_ai_adapter()

    # ---------- candidate gathering ----------
    async def _build_user_context(self, user: User) -> dict:
        profile = await self.users.get_profile(user.id)
        skills: list[str] = []
        years: int | None = None
        experience_level: str | None = None
        location: str | None = None
        preferred_job_types: list[str] = []
        preferred_locations: list[str] = []
        open_to_remote = False

        if profile is not None:
            skills = list(profile.skills or [])
            years = profile.years_experience
            experience_level = profile.experience_level
            location = profile.location
            preferred_job_types = list(profile.preferred_job_types or [])
            preferred_locations = list(profile.preferred_locations or [])
            open_to_remote = bool(profile.open_to_remote)

        # Blend in default resume skills
        default_version = await self.resumes.get_default_version(user.id)
        if default_version is not None:
            for s in (default_version.skills or []):
                if s.normalized_name not in skills:
                    skills.append(s.normalized_name)

        return {
            "user_id": str(user.id),
            "skills": skills,
            "years_experience": years,
            "experience_level": experience_level,
            "location": location,
            "preferred_job_types": preferred_job_types,
            "preferred_locations": preferred_locations,
            "open_to_remote": open_to_remote,
        }

    async def _build_swipe_history(self, user_id: uuid.UUID) -> list[dict]:
        rows, _ = await self.swipes.history(user_id, page=1, page_size=200)
        out: list[dict] = []
        for swipe in rows:
            job = await self.jobs.get_by_id(swipe.job_id, with_company=False)
            if job is None:
                continue
            out.append(
                {
                    "job_id": str(swipe.job_id),
                    "direction": swipe.direction,
                    "action": swipe.action,
                    "job_skills": list(job.skills or []),
                    "competition_level": job.competition_level,
                }
            )
        return out

    async def _gather_candidates(
        self, *, user_id: uuid.UUID, limit: int
    ) -> list[dict]:
        swiped_ids = set(await self.swipes.swiped_job_ids(user_id))

        # Pull a generous candidate pool from the active job repository.
        # We fetch more than `limit` so ranking has room to re-order.
        rows, _ = await self.jobs.search(
            only_active=True,
            page=1,
            page_size=max(limit * 4, 60),
            sort="posted_at",
            fresh_days=settings.FRESH_JOB_DAYS,
        )

        candidates: list[dict] = []
        for job in rows:
            if job.id in swiped_ids:
                continue
            fresh = freshness(job)
            candidates.append(
                {
                    "id": str(job.id),
                    "title": job.title,
                    "description": job.description,
                    "job_type": job.job_type,
                    "work_mode": job.work_mode,
                    "is_remote": job.is_remote,
                    "location": job.location,
                    "salary_min": job.salary_min,
                    "salary_max": job.salary_max,
                    "experience_level": job.experience_level,
                    "min_experience_years": job.min_experience_years,
                    "skills": list(job.skills or []),
                    "required_skills": list(job.required_skills or []),
                    "keywords": list(job.keywords or []),
                    "tags": list(job.tags or []),
                    "is_fresher_friendly": job.is_fresher_friendly,
                    "competition_level": job.competition_level,
                    "applicant_count": job.applicant_count,
                    "is_fresh": fresh["is_fresh"],
                    "posted_at": job.posted_at.isoformat(),
                    "company": {
                        "id": str(job.company.id) if job.company else None,
                        "name": job.company.name if job.company else None,
                        "company_type": job.company.company_type if job.company else None,
                        "logo_url": job.company.logo_url if job.company else None,
                        "slug": job.company.slug if job.company else None,
                    },
                }
            )
        return candidates

    # ---------- main entrypoint ----------
    async def recommend(
        self,
        *,
        user: User,
        limit: int = 20,
        target_user_id: uuid.UUID | None = None,
    ) -> list[dict]:
        # Admin can request recommendations for another user.
        effective_user = user
        if target_user_id is not None and target_user_id != user.id:
            other = await self.users.get_by_id(target_user_id)
            if other is None:
                from app.core.exceptions import NotFoundError

                raise NotFoundError("Target user not found")
            effective_user = other

        user_ctx = await self._build_user_context(effective_user)
        swipe_history = await self._build_swipe_history(effective_user.id)
        candidates = await self._gather_candidates(
            user_id=effective_user.id, limit=limit
        )

        # Call the port; the adapter itself guarantees fallback.
        try:
            ranked: list[RankedJob] = self.ai.rank(
                user_ctx=user_ctx,
                candidates=candidates,
                swipe_history=swipe_history,
            )
        except Exception as exc:  # noqa: BLE001
            logger.exception("rank() raised unexpectedly: %s", exc)
            ranked = []

        # Attach job bodies; trim to `limit`
        by_id = {c["id"]: c for c in candidates}
        results: list[dict] = []
        for r in ranked:
            candidate = by_id.get(r.job_id)
            if candidate is None:
                continue
            results.append(
                {
                    "job_id": r.job_id,
                    "match_percentage": r.match_score,
                    "reason_tags": list(r.reason_tags),
                    "generated_by": getattr(self.ai, "name", "local-heuristic"),
                    "job": candidate,
                }
            )
            if len(results) >= limit:
                break

        # Persist events (best-effort; never fail the request on this)
        try:
            await self.events.bulk_create(
                [
                    {
                        "user_id": effective_user.id,
                        "job_id": uuid.UUID(item["job_id"]),
                        "match_score": item["match_percentage"],
                        "reason_tags": item["reason_tags"],
                        "generated_by": item["generated_by"],
                    }
                    for item in results
                ]
            )
            await self.db.commit()
        except Exception as exc:  # noqa: BLE001
            logger.warning("Could not persist recommendation events: %s", exc)
            await self.db.rollback()

        return results