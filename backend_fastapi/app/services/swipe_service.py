"""Swipe service — idempotent right/left with single-transaction side effects."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import NotFoundError
from app.models.enums import ApplicationStatus, SwipeAction, SwipeDirection
from app.models.user import User
from app.repositories.job_repo import JobRepository
from app.repositories.swipe_repo import SwipeRepository
from app.services.competition_service import recompute_competition
from app.utils.time import early_window_open


class SwipeService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = SwipeRepository(db)
        self.jobs = JobRepository(db)

    # ---------- post swipe ----------
    async def swipe(
        self,
        *,
        user: User,
        job_id: uuid.UUID,
        direction: SwipeDirection,
        action: SwipeAction | None,
    ) -> dict:
        job = await self.jobs.get_by_id(job_id, with_company=False)
        if job is None or not job.is_active:
            raise NotFoundError("Job not found")

        # Derive the action from the direction when not provided.
        if direction == SwipeDirection.right:
            resolved_action = action if action in (SwipeAction.apply, SwipeAction.save) else SwipeAction.apply
        else:
            resolved_action = SwipeAction.skip

        # Capture the previous state BEFORE the upsert: the repository mutates the very same
        # identity-mapped Swipe instance in place, so reading it afterwards would return the
        # *new* values.
        previous = await self.repo.get_swipe(user.id, job_id)
        prev_action = previous.action if previous else None
        prev_direction = previous.direction if previous else None

        # Upsert the swipe row (idempotent)
        swipe = await self.repo.upsert_swipe(
            user_id=user.id,
            job_id=job_id,
            direction=direction.value,
            action=resolved_action.value,
        )

        # Side-effect transitions depend on prev_action / prev_direction captured above.

        # Case A: right + apply
        if direction == SwipeDirection.right and resolved_action == SwipeAction.apply:
            application = await self.repo.get_application(user.id, job_id)
            if application is None:
                is_early = early_window_open(job.posted_at, settings.EARLY_APPLICANT_WINDOW_HOURS)
                application = await self.repo.create_application(
                    user_id=user.id,
                    job_id=job_id,
                    status=ApplicationStatus.applied,
                    is_early_applicant=is_early,
                    applied_at=datetime.now(timezone.utc),
                )
                await self.repo.add_status_event(
                    application_id=application.id,
                    from_status=None,
                    to_status=ApplicationStatus.applied.value,
                    changed_by_id=user.id,
                    note="Swipe right (apply)",
                )
                await self.jobs.increment_applicant_count(job_id, 1)
            elif application.status == ApplicationStatus.saved.value:
                # promote saved → applied
                await self.repo.add_status_event(
                    application_id=application.id,
                    from_status=application.status,
                    to_status=ApplicationStatus.applied.value,
                    changed_by_id=user.id,
                    note="Swipe right (apply)",
                )
                application.status = ApplicationStatus.applied.value
                application.applied_at = application.applied_at or datetime.now(timezone.utc)
                if not application.is_early_applicant:
                    application.is_early_applicant = early_window_open(
                        job.posted_at, settings.EARLY_APPLICANT_WINDOW_HOURS
                    )
                await self.jobs.increment_applicant_count(job_id, 1)
            # Remove a stale saved_job row if the previous action was save
            if prev_action == SwipeAction.save.value and prev_direction == SwipeDirection.right.value:
                saved = await self.repo.get_saved(user.id, job_id)
                if saved is not None:
                    await self.repo.delete_saved(saved)

        # Case B: right + save
        elif direction == SwipeDirection.right and resolved_action == SwipeAction.save:
            await self.repo.add_saved(user_id=user.id, job_id=job_id)
            application = await self.repo.get_application(user.id, job_id)
            if application is None:
                await self.repo.create_application(
                    user_id=user.id,
                    job_id=job_id,
                    status=ApplicationStatus.saved,
                )
                await self.repo.add_status_event(
                    application_id=(await self.repo.get_application(user.id, job_id)).id,  # type: ignore[union-attr]
                    from_status=None,
                    to_status=ApplicationStatus.saved.value,
                    changed_by_id=user.id,
                    note="Swipe right (save)",
                )
            # Documented behaviour: switching apply -> save keeps an existing 'applied'
            # application as applied (an apply is a stronger signal than a save), and the
            # counter is not decremented.

        # Case C: left + skip — no side effects, but undo previously-created side effects if the
        # user is switching from a right swipe to a left swipe on the same job.
        else:
            # If they previously saved, remove the saved job and its 'saved' application row
            if prev_action == SwipeAction.save.value:
                saved = await self.repo.get_saved(user.id, job_id)
                if saved is not None:
                    await self.repo.delete_saved(saved)
                stale = await self.repo.get_application(user.id, job_id)
                if stale is not None and stale.status == ApplicationStatus.saved.value:
                    await self.repo.delete_application(stale)
            # If they previously applied, we DO NOT delete the application record.
            # Applications are historical facts; the user can update status from the UI.
            # Documented behavior.

        # Recompute competition level in-place after any counter change
        job_after = await self.jobs.get_by_id(job_id, with_company=False)
        if job_after is not None:
            recompute_competition(job_after)

        await self.db.commit()
        await self.db.refresh(swipe)
        return {
            "swipe_id": str(swipe.id),
            "job_id": str(swipe.job_id),
            "direction": swipe.direction,
            "action": swipe.action,
            "swiped_at": swipe.swiped_at,
        }

    # ---------- history ----------
    async def history(
        self, *, user: User, page: int = 1, page_size: int = 20
    ) -> tuple[list[dict], int]:
        rows, total = await self.repo.history(user.id, page=page, page_size=page_size)
        return [
            {
                "job_id": str(r.job_id),
                "direction": r.direction,
                "action": r.action,
                "swiped_at": r.swiped_at,
            }
            for r in rows
        ], total

    # ---------- undo last ----------
    async def undo_last(self, *, user: User) -> dict | None:
        last = await self.repo.last_swipe(user.id)
        if last is None:
            return None

        job = await self.jobs.get_by_id(last.job_id, with_company=False)

        # Reverse side effects based on the last action
        if last.direction == SwipeDirection.right.value and last.action == SwipeAction.apply.value:
            application = await self.repo.get_application(user.id, last.job_id)
            if application is not None and application.status == ApplicationStatus.applied.value:
                await self.repo.delete_application(application)
                if job is not None:
                    await self.jobs.increment_applicant_count(last.job_id, -1)
        elif last.direction == SwipeDirection.right.value and last.action == SwipeAction.save.value:
            saved = await self.repo.get_saved(user.id, last.job_id)
            if saved is not None:
                await self.repo.delete_saved(saved)
            application = await self.repo.get_application(user.id, last.job_id)
            if application is not None and application.status == ApplicationStatus.saved.value:
                await self.repo.delete_application(application)

        await self.repo.delete_swipe(last)

        # Recompute competition on the affected job
        if job is not None:
            refreshed = await self.jobs.get_by_id(last.job_id, with_company=False)
            if refreshed is not None:
                recompute_competition(refreshed)

        await self.db.commit()
        return {
            "job_id": str(last.job_id),
            "direction": last.direction,
            "action": last.action,
        }

    # ---------- saved jobs list ----------
    async def list_saved(
        self, *, user: User, page: int = 1, page_size: int = 20
    ) -> tuple[list[dict], int]:
        rows, total = await self.repo.list_saved(user.id, page=page, page_size=page_size)
        return [{"job_id": str(r.job_id), "saved_at": r.created_at} for r in rows], total