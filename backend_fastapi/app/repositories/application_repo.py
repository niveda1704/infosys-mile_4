"""Application repository — status transitions, events, and boards."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import ApplicationStatus
from app.models.swipe import Application, ApplicationStatusEvent


class ApplicationRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get(self, application_id: uuid.UUID) -> Application | None:
        stmt = select(Application).where(Application.id == application_id)
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def get_for_user(
        self, *, user_id: uuid.UUID, job_id: uuid.UUID
    ) -> Application | None:
        stmt = select(Application).where(
            Application.user_id == user_id, Application.job_id == job_id
        )
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def list_for_user(
        self,
        *,
        user_id: uuid.UUID,
        status: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Application], int]:
        stmt = select(Application).where(Application.user_id == user_id)
        count_stmt = select(func.count()).select_from(Application).where(
            Application.user_id == user_id
        )
        if status:
            stmt = stmt.where(Application.status == status)
            count_stmt = count_stmt.where(Application.status == status)
        stmt = stmt.order_by(Application.updated_at.desc())
        total = int((await self.db.execute(count_stmt)).scalar_one())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        rows = list((await self.db.execute(stmt)).scalars().all())
        return rows, total

    async def list_for_job(
        self,
        *,
        job_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Application], int]:
        # 'saved' rows are the seeker's private bookmarks, not applicants.
        stmt = select(Application).where(
            Application.job_id == job_id, Application.status != ApplicationStatus.saved.value
        )
        count_stmt = select(func.count()).select_from(Application).where(
            Application.job_id == job_id, Application.status != ApplicationStatus.saved.value
        )
        stmt = stmt.order_by(Application.created_at.desc())
        total = int((await self.db.execute(count_stmt)).scalar_one())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        rows = list((await self.db.execute(stmt)).scalars().all())
        return rows, total

    async def counts_by_status(self, user_id: uuid.UUID) -> dict[str, int]:
        stmt = (
            select(Application.status, func.count())
            .where(Application.user_id == user_id)
            .group_by(Application.status)
        )
        rows = (await self.db.execute(stmt)).all()
        return {status: int(count) for status, count in rows}

    async def list_events(self, application_id: uuid.UUID) -> list[ApplicationStatusEvent]:
        stmt = (
            select(ApplicationStatusEvent)
            .where(ApplicationStatusEvent.application_id == application_id)
            .order_by(ApplicationStatusEvent.created_at.asc())
        )
        return list((await self.db.execute(stmt)).scalars().all())

    async def add_event(
        self,
        *,
        application_id: uuid.UUID,
        from_status: str | None,
        to_status: str,
        changed_by_id: uuid.UUID | None,
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

    async def update_status(
        self, *, application: Application, new_status: ApplicationStatus, applied_at: datetime | None = None
    ) -> Application:
        application.status = new_status.value
        if applied_at is not None:
            application.applied_at = applied_at
        await self.db.flush()
        return application

    async def count_applications_since(
        self, *, user_id: uuid.UUID, since: datetime
    ) -> int:
        stmt = (
            select(func.count())
            .select_from(Application)
            .where(Application.user_id == user_id, Application.created_at >= since)
        )
        return int((await self.db.execute(stmt)).scalar_one())