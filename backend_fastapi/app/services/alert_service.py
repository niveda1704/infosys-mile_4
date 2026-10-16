"""Alert evaluation for the four charter alert types."""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.ats import ATSScore
from app.models.enums import CompanyType, NotificationType
from app.models.job import Job
from app.models.notification import Notification
from app.models.user import User, UserProfile
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)


class AlertService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.notifications = NotificationService(db)

    # ---------- daily cap ----------
    async def _today_count(self, user_id: uuid.UUID) -> int:
        since = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        stmt = (
            select(func.count())
            .select_from(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.created_at >= since,
                Notification.type.in_(
                    [
                        NotificationType.instant_job.value,
                        NotificationType.startup_hiring.value,
                        NotificationType.high_match.value,
                        NotificationType.low_competition.value,
                    ]
                ),
            )
        )
        return int((await self.db.execute(stmt)).scalar_one())

    async def _cap_reached(self, user_id: uuid.UUID) -> bool:
        return await self._today_count(user_id) >= settings.MAX_ALERTS_PER_DAY

    # ---------- evaluation ----------
    async def evaluate_job_for_user(
        self,
        *,
        user_id: uuid.UUID,
        job: Job,
        match_score: float | None = None,
    ) -> list[str]:
        """Return the list of alert types that fired (for tests / logging)."""
        if await self._cap_reached(user_id):
            return []

        pref = await self.notifications.get_or_create_preferences(user_id)
        enabled = set(pref.enabled_types or [])
        threshold = pref.match_threshold or 80
        fired: list[str] = []

        profile = (
            await self.db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
        ).scalar_one_or_none()

        # instant_job: matches the user's preferred job types / locations
        if NotificationType.instant_job.value in enabled and profile is not None:
            preferred_types = set(profile.preferred_job_types or [])
            preferred_locations = {l.lower() for l in (profile.preferred_locations or [])}
            job_loc = (job.location or "").lower()
            matches_type = not preferred_types or job.job_type in preferred_types
            matches_loc = (
                not preferred_locations
                or any(pl in job_loc for pl in preferred_locations if pl)
                or job.is_remote
            )
            if matches_type and matches_loc:
                await self.notifications.create(
                    user_id=user_id,
                    ntype=NotificationType.instant_job.value,
                    title=f"New job: {job.title}",
                    body=f"{job.title} matches your preferences.",
                    payload={"job_id": str(job.id)},
                    dedupe_key=f"instant_job:{job.id}",
                )
                fired.append(NotificationType.instant_job.value)

        # startup_hiring: company_type startup or newly_founded
        if NotificationType.startup_hiring.value in enabled:
            company = job.company
            if company is not None and (
                company.company_type in (CompanyType.startup.value, CompanyType.newly_founded.value)
                or company.is_newly_founded
            ):
                await self.notifications.create(
                    user_id=user_id,
                    ntype=NotificationType.startup_hiring.value,
                    title=f"Startup hiring: {job.title}",
                    body=f"{company.name} is hiring for {job.title}.",
                    payload={"job_id": str(job.id), "company_id": str(company.id)},
                    dedupe_key=f"startup_hiring:{job.id}",
                )
                fired.append(NotificationType.startup_hiring.value)

        # high_match: match score at or above the user's threshold
        if NotificationType.high_match.value in enabled and match_score is not None:
            if match_score >= threshold:
                await self.notifications.create(
                    user_id=user_id,
                    ntype=NotificationType.high_match.value,
                    title=f"High match ({int(match_score)}%): {job.title}",
                    body=f"Your profile matches {int(match_score)}% of this role.",
                    payload={"job_id": str(job.id), "match_score": match_score},
                    dedupe_key=f"high_match:{job.id}",
                )
                fired.append(NotificationType.high_match.value)

        # low_competition: competition_level == low and skills overlap
        if NotificationType.low_competition.value in enabled:
            if job.competition_level == "low" and profile is not None:
                user_skills = {s.lower() for s in (profile.skills or [])}
                job_skills = {s.lower() for s in (job.skills or [])}
                if user_skills & job_skills:
                    await self.notifications.create(
                        user_id=user_id,
                        ntype=NotificationType.low_competition.value,
                        title=f"Low competition: {job.title}",
                        body="Few applicants so far — apply early.",
                        payload={"job_id": str(job.id)},
                        dedupe_key=f"low_competition:{job.id}",
                    )
                    fired.append(NotificationType.low_competition.value)

        if fired:
            await self.db.commit()
        return fired

    async def evaluate_job_created(self, *, job: Job) -> int:
        """Evaluate a newly created job across matching job seekers."""
        # Candidates: users with a profile whose preferred job types overlap, or all seekers.
        stmt = (
            select(UserProfile.user_id)
            .select_from(UserProfile)
            .join(User, User.id == UserProfile.user_id)
            .where(User.is_active.is_(True))
            .limit(500)
        )
        user_ids = [uid for (uid,) in (await self.db.execute(stmt)).all()]
        fired_total = 0
        for uid in user_ids:
            try:
                fired = await self.evaluate_job_for_user(user_id=uid, job=job, match_score=None)
                fired_total += len(fired)
            except Exception:  # noqa: BLE001
                logger.exception("Alert evaluation failed for user %s", uid)
        return fired_total

    async def evaluate_ats_score(self, *, ats_row: ATSScore) -> list[str]:
        """Called after an ATS score is persisted; fires high_match / low_competition."""
        from app.repositories.job_repo import JobRepository

        job = await JobRepository(self.db).get_by_id(ats_row.job_id, with_company=True)
        if job is None:
            return []
        return await self.evaluate_job_for_user(
            user_id=ats_row.user_id, job=job, match_score=ats_row.match_score
        )


async def run_job_created_alerts(job_id: uuid.UUID) -> None:
    """Background entry point: evaluate alerts for a newly created job.

    Opens its own session (the request session is closed by the time this runs) and
    never raises, so a failure here cannot affect the API response.
    """
    from app.db.session import SessionLocal
    from app.repositories.job_repo import JobRepository

    try:
        async with SessionLocal() as db:
            job = await JobRepository(db).get_by_id(job_id, with_company=True)
            if job is None or not job.is_active:
                return
            fired = await AlertService(db).evaluate_job_created(job=job)
            logger.info("Job-created alerts for %s fired %d notification(s)", job_id, fired)
    except Exception:  # noqa: BLE001
        logger.exception("Job-created alert evaluation failed for job %s", job_id)
