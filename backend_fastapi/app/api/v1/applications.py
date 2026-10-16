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


def _to_response(app) -> ApplicationResponse:
    return ApplicationResponse(
        id=str(app.id),
        user_id=str(app.user_id),
        job_id=str(app.job_id),
        resume_version_id=str(app.resume_version_id) if app.resume_version_id else None,
        status=ApplicationStatus(app.status),
        is_early_applicant=app.is_early_applicant,
        applied_at=app.applied_at,
        created_at=app.created_at,
        updated_at=app.updated_at,
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
    return _to_response(app)


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
    return Page[ApplicationResponse](
        items=[_to_response(r) for r in rows],
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
    return ApplicationBoardResponse(
        columns=[
            ApplicationBoardColumn(
                status=col["status"],
                count=col["count"],
                items=[_to_response(a) for a in col["items"]],
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
    return _to_response(app)


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