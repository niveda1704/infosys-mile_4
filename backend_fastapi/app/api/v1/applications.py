"""Application endpoints."""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    CurrentUser,
    PaginationDep,
    get_db,
    require_job_seeker,
)
from app.core.exceptions import BadRequestError
from app.models.enums import ApplicationStatus
from app.models.user import User
from app.schemas.application import (
    ApplicationBoardColumn,
    ApplicationBoardResponse,
    ApplicationCreate,
    ApplicationResponse,
    ApplicationStatusEventResponse,
    ApplicationStatusUpdate,
)
from app.schemas.common import Page
from app.services.application_service import ApplicationService

router = APIRouter(prefix="/applications", tags=["applications"])


def _to_response(app, job=None) -> ApplicationResponse:
    title = "Software Engineer"
    company_name = "Company"
    location = "Remote / Onsite"
    salary = "Competitive"
    salary_min = None
    salary_max = None
    skills = []

    if job is not None:
        title = job.title or title
        location = job.location or location
        salary_min = job.salary_min
        salary_max = job.salary_max
        skills = job.skills or job.required_skills or []
        try:
            if getattr(job, "company", None):
                company_name = job.company.name
        except Exception:
            pass
        if salary_min or salary_max:
            if salary_min and salary_max:
                salary = f"₹{salary_min / 100000:.1f} - {salary_max / 100000:.1f} LPA".replace(".0", "")
            elif salary_max:
                salary = f"Up to ₹{salary_max / 100000:.1f} LPA".replace(".0", "")
            else:
                salary = f"From ₹{salary_min / 100000:.1f} LPA".replace(".0", "")

    return ApplicationResponse(
        id=str(app.id),
        user_id=str(app.user_id),
        job_id=str(app.job_id),
        resume_version_id=str(app.resume_version_id) if app.resume_version_id else None,
        status=ApplicationStatus(app.status),
        is_early_applicant=app.is_early_applicant,
        applied_at=app.applied_at or app.created_at,
        created_at=app.created_at,
        updated_at=app.updated_at,
        title=title,
        job_title=title,
        company=company_name,
        company_name=company_name,
        location=location,
        salary=salary,
        salary_min=salary_min,
        salary_max=salary_max,
        skills=skills,
        match_percentage=85.0,
    )


@router.post(
    "",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Apply to a job (job seeker)",
)
async def create_application(
    payload: ApplicationCreate,
    user: Annotated[User, Depends(require_job_seeker)],
    db: AsyncSession = Depends(get_db),
) -> ApplicationResponse:
    try:
        job_id = uuid.UUID(payload.job_id)
    except ValueError:
        raise BadRequestError("Invalid job_id")
    rvid = None
    if payload.resume_version_id:
        try:
            rvid = uuid.UUID(payload.resume_version_id)
        except ValueError:
            raise BadRequestError("Invalid resume_version_id")
    app = await ApplicationService(db).create(
        user=user, job_id=job_id, resume_version_id=rvid
    )
    job = None
    try:
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        from app.models.job import Job
        job_res = await db.execute(
            select(Job).options(selectinload(Job.company)).where(Job.id == job_id)
        )
        job = job_res.scalars().first()
    except Exception:
        pass
    return _to_response(app, job)


@router.get(
    "",
    response_model=Page[ApplicationResponse],
    summary="My applications (job seeker)",
)
async def list_my_applications(
    user: Annotated[User, Depends(require_job_seeker)],
    db: AsyncSession = Depends(get_db),
    pagination: PaginationDep = None,  # type: ignore[assignment]
    status_filter: ApplicationStatus | None = Query(default=None, alias="status"),
) -> Page[ApplicationResponse]:
    rows, total = await ApplicationService(db).list_mine(
        user=user,
        status=status_filter.value if status_filter else None,
        page=pagination.page,
        page_size=pagination.page_size,
    )
    pages = (total + pagination.page_size - 1) // pagination.page_size if pagination.page_size else 0

    jobs_map = {}
    job_ids = list({r.job_id for r in rows if r.job_id})
    if job_ids:
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        from app.models.job import Job
        try:
            job_res = await db.execute(
                select(Job).options(selectinload(Job.company)).where(Job.id.in_(job_ids))
            )
            jobs_map = {j.id: j for j in job_res.scalars().all()}
        except Exception:
            pass

    return Page[ApplicationResponse](
        items=[_to_response(r, jobs_map.get(r.job_id)) for r in rows],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages,
    )


@router.get(
    "/board",
    response_model=ApplicationBoardResponse,
    summary="Kanban view of my applications (job seeker)",
)
async def board(
    user: Annotated[User, Depends(require_job_seeker)],
    db: AsyncSession = Depends(get_db),
) -> ApplicationBoardResponse:
    columns = await ApplicationService(db).board(user=user)

    all_job_ids = set()
    for col in columns:
        for a in col["items"]:
            if getattr(a, "job_id", None):
                all_job_ids.add(a.job_id)

    jobs_map = {}
    if all_job_ids:
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        from app.models.job import Job
        try:
            job_res = await db.execute(
                select(Job).options(selectinload(Job.company)).where(Job.id.in_(list(all_job_ids)))
            )
            jobs_map = {j.id: j for j in job_res.scalars().all()}
        except Exception:
            pass

    return ApplicationBoardResponse(
        columns=[
            ApplicationBoardColumn(
                status=col["status"],
                count=col["count"],
                items=[_to_response(a, jobs_map.get(a.job_id)) for a in col["items"]],
            )
            for col in columns
        ]
    )


@router.get(
    "/{application_id}",
    response_model=ApplicationResponse,
    summary="Get one application (owner only)",
)
async def get_application(
    application_id: uuid.UUID,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> ApplicationResponse:
    app = await ApplicationService(db).get(user=user, application_id=application_id)
    job = None
    if app.job_id:
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        from app.models.job import Job
        try:
            job_res = await db.execute(
                select(Job).options(selectinload(Job.company)).where(Job.id == app.job_id)
            )
            job = job_res.scalars().first()
        except Exception:
            pass
    return _to_response(app, job)


@router.get(
    "/{application_id}/history",
    response_model=list[ApplicationStatusEventResponse],
    summary="Application status history (owner only)",
)
async def history(
    application_id: uuid.UUID,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> list[ApplicationStatusEventResponse]:
    events = await ApplicationService(db).history(user=user, application_id=application_id)
    return [
        ApplicationStatusEventResponse(
            id=str(e.id),
            application_id=str(e.application_id),
            from_status=e.from_status,
            to_status=e.to_status,
            changed_by_id=str(e.changed_by_id) if e.changed_by_id else None,
            note=e.note,
            created_at=e.created_at,
        )
        for e in events
    ]


@router.patch(
    "/{application_id}/status",
    response_model=ApplicationResponse,
    summary="Update application status (owning recruiter or admin)",
)
async def update_status(
    application_id: uuid.UUID,
    payload: ApplicationStatusUpdate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> ApplicationResponse:
    app = await ApplicationService(db).update_status(
        actor=user,
        application_id=application_id,
        new_status=payload.status,
        note=payload.note,
    )
    return _to_response(app)