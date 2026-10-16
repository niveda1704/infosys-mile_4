"""Swipe and saved-jobs endpoints."""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import PaginationDep, get_db, require_job_seeker
from app.core.exceptions import BadRequestError
from app.models.enums import SwipeAction, SwipeDirection
from app.models.user import User
from app.schemas.common import Page
from app.schemas.swipe import (
    SavedJobResponse,
    SwipeCreate,
    SwipeHistoryItem,
    SwipeResponse,
)
from app.services.swipe_service import SwipeService

router = APIRouter(tags=["swipes"])


@router.post(
    "/swipes",
    response_model=SwipeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record a swipe (job seeker)",
)
async def create_swipe(
    payload: SwipeCreate,
    user: Annotated[User, Depends(require_job_seeker)],
    db: AsyncSession = Depends(get_db),
) -> SwipeResponse:
    try:
        job_id = uuid.UUID(payload.job_id)
    except ValueError:
        raise BadRequestError("Invalid job_id")
    data = await SwipeService(db).swipe(
        user=user,
        job_id=job_id,
        direction=payload.direction,
        action=payload.action,
    )
    return SwipeResponse(
        swipe_id=data["swipe_id"],
        job_id=data["job_id"],
        direction=SwipeDirection(data["direction"]),
        action=SwipeAction(data["action"]),
        swiped_at=data["swiped_at"],
    )


@router.get(
    "/swipes/history",
    response_model=Page[SwipeHistoryItem],
    summary="My swipe history (job seeker)",
)
async def swipe_history(
    user: Annotated[User, Depends(require_job_seeker)],
    db: AsyncSession = Depends(get_db),
    pagination: PaginationDep = None,  # type: ignore[assignment]
) -> Page[SwipeHistoryItem]:
    items, total = await SwipeService(db).history(
        user=user, page=pagination.page, page_size=pagination.page_size
    )
    pages = (total + pagination.page_size - 1) // pagination.page_size if pagination.page_size else 0
    return Page[SwipeHistoryItem](
        items=[
            SwipeHistoryItem(
                job_id=i["job_id"],
                direction=SwipeDirection(i["direction"]),
                action=SwipeAction(i["action"]),
                swiped_at=i["swiped_at"],
            )
            for i in items
        ],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages,
    )


@router.delete(
    "/swipes/last",
    summary="Undo my last swipe (job seeker)",
)
async def undo_last_swipe(
    user: Annotated[User, Depends(require_job_seeker)],
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await SwipeService(db).undo_last(user=user)
    if result is None:
        return {"undone": False}
    return {"undone": True, **result}


@router.get(
    "/saved-jobs",
    response_model=Page[SavedJobResponse],
    summary="My saved jobs (job seeker)",
)
@router.get(
    "/jobs/saved",
    response_model=Page[SavedJobResponse],
    summary="My saved jobs alias",
)
@router.get(
    "/saved",
    response_model=Page[SavedJobResponse],
    summary="My saved jobs alias 2",
)
async def list_saved_jobs(
    user: Annotated[User, Depends(require_job_seeker)],
    db: AsyncSession = Depends(get_db),
    pagination: PaginationDep = None,  # type: ignore[assignment]
) -> Page[SavedJobResponse]:
    items, total = await SwipeService(db).list_saved(
        user=user, page=pagination.page, page_size=pagination.page_size
    )
    pages = (total + pagination.page_size - 1) // pagination.page_size if pagination.page_size else 0
    return Page[SavedJobResponse](
        items=[SavedJobResponse(job_id=i["job_id"], saved_at=i["saved_at"]) for i in items],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages,
    )