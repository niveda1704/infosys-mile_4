"""ATS endpoints — job seeker only."""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_job_seeker
from app.core.exceptions import BadRequestError, NotFoundError
from app.models.enums import SuggestionSource
from app.models.user import User
from app.repositories.resume_repo import ResumeRepository
from app.schemas.ats import (
    ATSScoreRequest,
    ATSScoreResponse,
    ATSSuggestionRequest,
    ATSSuggestionResponse,
)
from app.services.ats_service import ATSService

router = APIRouter(prefix="/ats", tags=["ats"])


@router.post(
    "/score",
    response_model=ATSScoreResponse,
    status_code=status.HTTP_200_OK,
    summary="Compute ATS score for a resume/job pair (job seeker)",
)
async def score(
    payload: ATSScoreRequest,
    user: Annotated[User, Depends(require_job_seeker)],
    db: AsyncSession = Depends(get_db),
) -> ATSScoreResponse:
    version_id = payload.resume_version_id
    if version_id is None:
        try:
            rid = uuid.UUID(payload.resume_id or "")
        except ValueError:
            raise BadRequestError("Invalid resume_id")
        repo = ResumeRepository(db)
        resume = await repo.get(rid)
        if resume is None or resume.user_id != user.id:
            raise NotFoundError("Resume not found")
        default = await repo.get_default_version(user.id)
        if default is None or default.resume_id != rid:
            if not resume.versions:
                raise NotFoundError("No version available for this resume")
            chosen = max(resume.versions, key=lambda v: v.version_number)
            version_id = str(chosen.id)
        else:
            version_id = str(default.id)
    try:
        version_uuid = uuid.UUID(version_id)
        job_uuid = uuid.UUID(payload.job_id)
    except ValueError:
        raise BadRequestError("Invalid resume_version_id or job_id")

    data = await ATSService(db).score(
        user=user, resume_version_id=version_uuid, job_id=job_uuid
    )
    return ATSScoreResponse(**data)


@router.post(
    "/suggestions",
    response_model=ATSSuggestionResponse,
    summary="Generate resume optimization suggestions (job seeker)",
)
async def suggestions(
    payload: ATSSuggestionRequest,
    user: Annotated[User, Depends(require_job_seeker)],
    db: AsyncSession = Depends(get_db),
) -> ATSSuggestionResponse:
    try:
        version_uuid = uuid.UUID(payload.resume_version_id)
        job_uuid = uuid.UUID(payload.job_id)
    except ValueError:
        raise BadRequestError("Invalid resume_version_id or job_id")
    result = await ATSService(db).suggestions(
        user=user, resume_version_id=version_uuid, job_id=job_uuid
    )
    return ATSSuggestionResponse(
        suggestions=result.suggestions,
        suggestion_source=SuggestionSource(result.source),
    )


@router.get(
    "/scores",
    response_model=list[ATSScoreResponse],
    summary="List my ATS score history (job seeker)",
)
async def list_scores(
    user: Annotated[User, Depends(require_job_seeker)],
    db: AsyncSession = Depends(get_db),
    resume_id: str | None = Query(default=None),
) -> list[ATSScoreResponse]:
    rid = None
    if resume_id:
        try:
            rid = uuid.UUID(resume_id)
        except ValueError:
            raise BadRequestError("Invalid resume_id")
    rows = await ATSService(db).list_scores(user=user, resume_id=rid)
    return [ATSScoreResponse(**r) for r in rows]