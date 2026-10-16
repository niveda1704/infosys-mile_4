"""Swipe / SavedJob / Application repository."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import ApplicationStatus
from app.models.swipe import Application, ApplicationStatusEvent, SavedJob, Swipe


class SwipeRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ---------- swipes ----------
    async def get_swipe(self, user_id: uuid.UUID, job_id: uuid.UUID) -> Swipe | None:
        stmt = select(Swipe).where(Swipe.user_id == user_id, Swipe.job_id == job_id)
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def upsert_swipe(
        self,
        *,
        user_id: uuid.UUID,
        job_id: uuid.UUID,
        direction: str,
        action: str,
    ) -> Swipe:
        """Idempotent and race-free: atomic upsert of the unique (user, job) swipe row."""
        now = datetime.now(timezone.utc)
        stmt = (
            pg_insert(Swipe)
            .values(
                user_id=user_id,
                job_id=job_id,
                direction=direction,
                action=action,
                swiped_at=now,
            )
            .on_conflict_do_update(
                index_elements=["user_id", "job_id"],
                set_={"direction": direction, "action": action, "swiped_at": now},
            )
        )
        await self.db.execute(stmt)
        # Re-read through the ORM, overwriting any stale identity-mapped copy.
        reload_stmt = (
            select(Swipe)
            .where(Swipe.user_id == user_id, Swipe.job_id == job_id)
            .execution_options(populate_existing=True)
        )
        return (await self.db.execute(reload_stmt)).scalar_one()

    async def delete_swipe(self, swipe: Swipe) -> None:
        await self.db.delete(swipe)

    async def last_swipe(self, user_id: uuid.UUID) -> Swipe | None:
        stmt = (
            select(Swipe)
            .where(Swipe.user_id == user_id)
            .order_by(Swipe.swiped_at.desc())
            .limit(1)
        )
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def history(
        self, user_id: uuid.UUID, *, page: int = 1, page_size: int = 20
    ) -> tuple[list[Swipe], int]:
        stmt = (
            select(Swipe)
            .where(Swipe.user_id == user_id)
            .order_by(Swipe.swiped_at.desc())
        )
        count_stmt = select(func.count()).select_from(Swipe).where(Swipe.user_id == user_id)
        total = int((await self.db.execute(count_stmt)).scalar_one())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        rows = list((await self.db.execute(stmt)).scalars().all())
        return rows, total

    async def swiped_job_ids(self, user_id: uuid.UUID) -> list[uuid.UUID]:
        stmt = select(Swipe.job_id).where(Swipe.user_id == user_id)
        return list((await self.db.execute(stmt)).scalars().all())

    # ---------- saved jobs ----------
    async def get_saved(self, user_id: uuid.UUID, job_id: uuid.UUID) -> SavedJob | None:
        stmt = select(SavedJob).where(SavedJob.user_id == user_id, SavedJob.job_id == job_id)
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def add_saved(self, *, user_id: uuid.UUID, job_id: uuid.UUID) -> SavedJob:
        existing = await self.get_saved(user_id, job_id)
        if existing is not None:
            return existing
        saved = SavedJob(user_id=user_id, job_id=job_id)
        self.db.add(saved)
        await self.db.flush()
        return saved

    async def delete_saved(self, saved: SavedJob) -> None:
        await self.db.delete(saved)

    async def list_saved(
        self, user_id: uuid.UUID, *, page: int = 1, page_size: int = 20
    ) -> tuple[list[SavedJob], int]:
        stmt = (
            select(SavedJob)
            .where(SavedJob.user_id == user_id)
            .order_by(SavedJob.created_at.desc())
        )
        count_stmt = select(func.count()).select_from(SavedJob).where(SavedJob.user_id == user_id)
        total = int((await self.db.execute(count_stmt)).scalar_one())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        rows = list((await self.db.execute(stmt)).scalars().all())
        return rows, total

    # ---------- applications (minimal in this phase) ----------
    async def get_application(self, user_id: uuid.UUID, job_id: uuid.UUID) -> Application | None:
        stmt = select(Application).where(
            Application.user_id == user_id, Application.job_id == job_id
        )
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def create_application(
        self,
        *,
        user_id: uuid.UUID,
        job_id: uuid.UUID,
        status: ApplicationStatus,
        is_early_applicant: bool = False,
        applied_at: datetime | None = None,
    ) -> Application:
        app = Application(
            user_id=user_id,
            job_id=job_id,
            status=status.value,
            is_early_applicant=is_early_applicant,
            applied_at=applied_at,
        )
        self.db.add(app)
        await self.db.flush()
        return app

    async def delete_application(self, application: Application) -> None:
        await self.db.delete(application)

    async def add_status_event(
        self,
        *,
        application_id: uuid.UUID,
        from_status: str | None,
        to_status: str,
        changed_by_id: uuid.UUID | None = None,
        note: str | None = None,
    ) -> ApplicationStatusEvent:
        event = ApplicationStatusEvent(
            application_id=application_id,
            from_status=from_status,
            to_status=to_status,
            changed_by_id=changed_by_id,
            note=note,
        )
        self.db.add(event)
        await self.db.flush()
        return event