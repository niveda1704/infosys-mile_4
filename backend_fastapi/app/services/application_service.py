"""Application service — status transitions, history, board, RBAC guards."""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    ForbiddenError,
    InvalidStatusTransitionError,
    NotFoundError,
)
from app.core.config import settings
from app.models.enums import ApplicationStatus, UserRole
from app.models.swipe import Application
from app.models.user import User
from app.repositories.application_repo import ApplicationRepository
from app.repositories.job_repo import JobRepository
from app.repositories.resume_repo import ResumeRepository
from app.repositories.swipe_repo import SwipeRepository
from app.utils.time import early_window_open

logger = logging.getLogger(__name__)


_ALLOWED_TRANSITIONS: dict[ApplicationStatus, set[ApplicationStatus]] = {
    ApplicationStatus.saved: {ApplicationStatus.applied},
    ApplicationStatus.applied: {ApplicationStatus.shortlisted, ApplicationStatus.rejected},
    ApplicationStatus.shortlisted: {ApplicationStatus.interview, ApplicationStatus.rejected},
    ApplicationStatus.interview: {ApplicationStatus.rejected},
    ApplicationStatus.rejected: set(),
}


class ApplicationService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = ApplicationRepository(db)
        self.jobs = JobRepository(db)
        self.resumes = ResumeRepository(db)
        self.swipes = SwipeRepository(db)

    # ---------- ownership / role guards ----------
    async def _get_owned(self, user: User, application_id: uuid.UUID) -> Application:
        app = await self.repo.get(application_id)
        if app is None or app.user_id != user.id:
            raise NotFoundError("Application not found")
        return app

    # ---------- create (explicit apply) ----------
    async def create(
        self,
        *,
        user: User,
        job_id: uuid.UUID,
        resume_version_id: uuid.UUID | None,
    ) -> Application:
        job = await self.jobs.get_by_id(job_id, with_company=False)
        if job is None or not job.is_active:
            raise NotFoundError("Job not found")

        # Resume ownership check (if provided)
        if resume_version_id is not None:
            version = await self.resumes.get_version(resume_version_id)
            if version is None or version.user_id != user.id:
                raise NotFoundError("Resume version not found")
        else:
            default = await self.resumes.get_default_version(user.id)
            if default is not None:
                resume_version_id = default.id

        existing = await self.repo.get_for_user(user_id=user.id, job_id=job.id)
        if existing is None:
            is_early = early_window_open(job.posted_at, settings.EARLY_APPLICANT_WINDOW_HOURS)
            app = Application(
                user_id=user.id,
                job_id=job.id,
                resume_version_id=resume_version_id,
                status=ApplicationStatus.applied.value,
                is_early_applicant=is_early,
                applied_at=datetime.now(timezone.utc),
            )
            self.db.add(app)
            await self.db.flush()
            await self.repo.add_event(
                application_id=app.id,
                from_status=None,
                to_status=ApplicationStatus.applied.value,
                changed_by_id=user.id,
                note="Applied",
            )
            await self.jobs.increment_applicant_count(job.id, 1)
        else:
            # Promote saved → applied
            if existing.status == ApplicationStatus.saved.value:
                await self.repo.add_event(
                    application_id=existing.id,
                    from_status=existing.status,
                    to_status=ApplicationStatus.applied.value,
                    changed_by_id=user.id,
                    note="Applied",
                )
                existing.status = ApplicationStatus.applied.value
                existing.applied_at = datetime.now(timezone.utc)
                existing.resume_version_id = resume_version_id or existing.resume_version_id
                if not existing.is_early_applicant:
                    existing.is_early_applicant = early_window_open(
                        job.posted_at, settings.EARLY_APPLICANT_WINDOW_HOURS
                    )
                await self.jobs.increment_applicant_count(job.id, 1)
            app = existing

        await self.db.commit()
        await self.db.refresh(app)
        return app

    # ---------- list ----------
    async def list_mine(
        self,
        *,
        user: User,
        status: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Application], int]:
        return await self.repo.list_for_user(
            user_id=user.id, status=status, page=page, page_size=page_size
        )

    async def get(self, *, user: User, application_id: uuid.UUID) -> Application:
        return await self._get_owned(user, application_id)

    async def list_for_job(
        self,
        *,
        user: User,
        job_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Application], int]:
        job = await self.jobs.get_by_id(job_id, with_company=False)
        if job is None:
            raise NotFoundError("Job not found")
        if user.role != UserRole.admin.value and job.posted_by_id != user.id:
            raise ForbiddenError("You do not own this job")
        return await self.repo.list_for_job(job_id=job_id, page=page, page_size=page_size)

    async def history(self, *, user: User, application_id: uuid.UUID):
        app = await self._get_owned(user, application_id)
        return await self.repo.list_events(app.id)

    async def board(self, *, user: User):
        counts = await self.repo.counts_by_status(user.id)
        columns = []
        for status in (
            ApplicationStatus.saved,
            ApplicationStatus.applied,
            ApplicationStatus.shortlisted,
            ApplicationStatus.interview,
            ApplicationStatus.rejected,
        ):
            rows, _ = await self.repo.list_for_user(
                user_id=user.id, status=status.value, page=1, page_size=50
            )
            columns.append(
                {
                    "status": status,
                    "count": counts.get(status.value, 0),
                    "items": rows,
                }
            )
        return columns

    # ---------- status update (recruiter/admin) ----------
    async def update_status(
        self,
        *,
        actor: User,
        application_id: uuid.UUID,
        new_status: ApplicationStatus,
        note: str | None,
    ) -> Application:
        app = await self.repo.get(application_id)
        if app is None:
            raise NotFoundError("Application not found")

        job = await self.jobs.get_by_id(app.job_id, with_company=False)
        if job is None:
            raise NotFoundError("Job not found")

        if actor.role != UserRole.admin.value and job.posted_by_id != actor.id:
            raise ForbiddenError("You do not own this job")

        current = ApplicationStatus(app.status)
        if current == ApplicationStatus.saved:
            # A bookmark is not an application; only the seeker can apply (this also keeps
            # applicant_count and applied_at consistent).
            raise InvalidStatusTransitionError("A saved job has not been applied to yet")
        if new_status not in _ALLOWED_TRANSITIONS.get(current, set()):
            raise InvalidStatusTransitionError(
                f"Cannot move from {current.value} to {new_status.value}"
            )

        from_status = app.status
        await self.repo.add_event(
            application_id=app.id,
            from_status=from_status,
            to_status=new_status.value,
            changed_by_id=actor.id,
            note=note,
        )
        await self.repo.update_status(application=app, new_status=new_status)
        await self.db.commit()

        # Notify the applicant (best-effort, done after commit)
        try:
            from app.services.notification_service import NotificationService

            await NotificationService(self.db).notify_application_status(
                user_id=app.user_id, application_id=app.id, status=new_status.value
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("Status notification failed for application %s: %s", app.id, exc)

        await self.db.refresh(app)
        return app

    async def delete(self, *, user: User, application_id: uuid.UUID) -> None:
        app = await self._get_owned(user, application_id)
        # Only 'saved' applications can be deleted by the applicant.
        if app.status != ApplicationStatus.saved.value:
            raise InvalidStatusTransitionError("Only saved applications can be removed")
        await self.db.delete(app)
        await self.db.commit()