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

    jobs_map = {}
    job_ids = []
    for i in items:
        try:
            job_ids.append(uuid.UUID(str(i["job_id"])))
        except (ValueError, AttributeError):
            pass

    if job_ids:
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        from app.models.job import Job
        try:
            job_res = await db.execute(
                select(Job).options(selectinload(Job.company)).where(Job.id.in_(job_ids))
            )
            jobs_map = {str(j.id): j for j in job_res.scalars().all()}
        except Exception:
            pass

    results = []
    for i in items:
        jid = str(i["job_id"])
        job = jobs_map.get(jid)
        c_name = "Company"
        title = "Job Opportunity"
        location = "Remote / Onsite"
        salary = "Competitive"
        salary_min = None
        salary_max = None
        skills = []
        if job:
            title = job.title or title
            location = job.location or location
            salary_min = job.salary_min
            salary_max = job.salary_max
            skills = job.skills or job.required_skills or []
            try:
                if job.company:
                    c_name = job.company.name
            except Exception:
                pass
            if salary_min or salary_max:
                if salary_min and salary_max:
                    salary = f"₹{salary_min / 100000:.1f} - {salary_max / 100000:.1f} LPA".replace(".0", "")
                elif salary_max:
                    salary = f"Up to ₹{salary_max / 100000:.1f} LPA".replace(".0", "")
                else:
                    salary = f"From ₹{salary_min / 100000:.1f} LPA".replace(".0", "")
        results.append(
            SavedJobResponse(
                id=jid,
                job_id=jid,
                saved_at=i["saved_at"],
                title=title,
                job_title=title,
                company=c_name,
                company_name=c_name,
                location=location,
                salary=salary,
                salary_min=salary_min,
                salary_max=salary_max,
                skills=skills,
            )
        )

    return Page[SavedJobResponse](
        items=results,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages,
    )