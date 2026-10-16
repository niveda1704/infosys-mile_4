"""Job endpoints — search, CRUD, competition."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, OptionalUser, PaginationDep, get_db, require_recruiter_or_admin
from app.core.config import settings
from app.models.enums import CompanyType, CompetitionLevel, ExperienceLevel, JobType, WorkMode
from app.models.job import Job
from app.models.user import User
from app.schemas.common import Page
from app.schemas.company import CompanySummary
from app.schemas.job import (
    JobCardResponse,
    JobCompetitionResponse,
    JobCreate,
    JobResponse,
    JobUpdate,
)
from app.services.alert_service import run_job_created_alerts
from app.services.competition_service import freshness
from app.services.job_service import JobService

router = APIRouter(prefix="/jobs", tags=["jobs"])


# ---------- helpers ----------
def _company_summary(company) -> CompanySummary:
    return CompanySummary(
        id=str(company.id),
        name=company.name,
        slug=company.slug,
        logo_url=company.logo_url,
        company_type=CompanyType(company.company_type),
        is_newly_founded=company.is_newly_founded,
        industry=company.industry,
    )


def _job_card(job: Job, *, match_score: float | None = None, reason_tags: list[str] | None = None) -> JobCardResponse:
    fresh = freshness(job)
    return JobCardResponse(
        id=str(job.id),
        title=job.title,
        company=_company_summary(job.company),
        job_type=JobType(job.job_type),
        work_mode=WorkMode(job.work_mode),
        is_remote=job.is_remote,
        location=job.location,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        salary_currency=job.salary_currency,
        experience_level=ExperienceLevel(job.experience_level),
        min_experience_years=job.min_experience_years,
        skills=list(job.skills or []),
        is_fresher_friendly=job.is_fresher_friendly,
        posted_at=job.posted_at,
        competition_level=CompetitionLevel(job.competition_level),
        applicant_count=job.applicant_count,
        is_fresh=fresh["is_fresh"],
        is_early_window_open=fresh["is_early_window_open"],
        match_score=match_score,
        reason_tags=reason_tags or [],
    )


def _job_response(job: Job) -> JobResponse:
    fresh = freshness(job)
    return JobResponse(
        id=str(job.id),
        title=job.title,
        description=job.description,
        company=_company_summary(job.company),
        job_type=JobType(job.job_type),
        work_mode=WorkMode(job.work_mode),
        is_remote=job.is_remote,
        location=job.location,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        salary_currency=job.salary_currency,
        experience_level=ExperienceLevel(job.experience_level),
        min_experience_years=job.min_experience_years,
        skills=list(job.skills or []),
        required_skills=list(job.required_skills or []),
        keywords=list(job.keywords or []),
        tags=list(job.tags or []),
        expires_at=job.expires_at,
        is_fresher_friendly=job.is_fresher_friendly,
        posted_at=job.posted_at,
        is_active=job.is_active,
        applicant_count=job.applicant_count,
        competition_level=CompetitionLevel(job.competition_level),
        is_fresh=fresh["is_fresh"],
        is_early_window_open=fresh["is_early_window_open"],
        hours_since_posted=fresh["hours_since_posted"],
        created_at=job.created_at,
        updated_at=job.updated_at,
    )


# ---------- IMPORTANT: /search before /{job_id} ----------
@router.get("/search", response_model=Page[JobCardResponse], summary="Search jobs")
async def search_jobs(
    db: AsyncSession = Depends(get_db),
    pagination: PaginationDep = None,  # type: ignore[assignment]
    q: str | None = Query(default=None, max_length=200),
    location: str | None = Query(default=None, max_length=200),
    job_type: JobType | None = Query(default=None),
    work_mode: WorkMode | None = Query(default=None),
    remote: bool | None = Query(default=None),
    company_type: CompanyType | None = Query(default=None),
    salary_min: int | None = Query(default=None, ge=0),
    salary_max: int | None = Query(default=None, ge=0),
    experience_level: ExperienceLevel | None = Query(default=None),
    skills: str | None = Query(default=None, description="Comma-separated skill list"),
    skills_match: str = Query(default="any", pattern="^(any|all)$"),
    fresher_friendly: bool | None = Query(default=None),
    low_competition: bool | None = Query(default=None),
    recently_posted: bool | None = Query(default=None),
    competition_level: CompetitionLevel | None = Query(default=None),
    sort: str = Query(default="posted_at", pattern="^(posted_at|salary|competition|match)$"),
) -> Page[JobCardResponse]:
    skill_list = [s.strip() for s in skills.split(",")] if skills else None
    rows, total = await JobService(db).search(
        q=q,
        location=location,
        job_type=job_type.value if job_type else None,
        work_mode=work_mode.value if work_mode else None,
        remote=remote,
        company_type=company_type.value if company_type else None,
        salary_min=salary_min,
        salary_max=salary_max,
        experience_level=experience_level.value if experience_level else None,
        skills=skill_list,
        skills_match=skills_match,
        fresher_friendly=fresher_friendly,
        low_competition=low_competition,
        recently_posted=recently_posted,
        competition_level=competition_level.value if competition_level else None,
        sort=sort,
        page=pagination.page,
        page_size=pagination.page_size,
        fresh_days=settings.FRESH_JOB_DAYS,
    )
    pages = (total + pagination.page_size - 1) // pagination.page_size if pagination.page_size else 0
    return Page[JobCardResponse](
        items=[_job_card(j) for j in rows],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages,
    )


@router.get("", response_model=Page[JobCardResponse], summary="List jobs")
async def list_jobs(
    db: AsyncSession = Depends(get_db),
    pagination: PaginationDep = None,  # type: ignore[assignment]
    q: str | None = Query(default=None, max_length=200),
    location: str | None = Query(default=None, max_length=200),
    job_type: JobType | None = Query(default=None),
    work_mode: WorkMode | None = Query(default=None),
    remote: bool | None = Query(default=None),
    company_type: CompanyType | None = Query(default=None),
    salary_min: int | None = Query(default=None, ge=0),
    salary_max: int | None = Query(default=None, ge=0),
    experience_level: ExperienceLevel | None = Query(default=None),
    skills: str | None = Query(default=None),
    skills_match: str = Query(default="any", pattern="^(any|all)$"),
    fresher_friendly: bool | None = Query(default=None),
    low_competition: bool | None = Query(default=None),
    recently_posted: bool | None = Query(default=None),
    competition_level: CompetitionLevel | None = Query(default=None),
    sort: str = Query(default="posted_at", pattern="^(posted_at|salary|competition|match)$"),
) -> Page[JobCardResponse]:
    res = await search_jobs(  # type: ignore[misc]
        db=db,
        pagination=pagination,
        q=q,
        location=location,
        job_type=job_type,
        work_mode=work_mode,
        remote=remote,
        company_type=company_type,
        salary_min=salary_min,
        salary_max=salary_max,
        experience_level=experience_level,
        skills=skills,
        skills_match=skills_match,
        fresher_friendly=fresher_friendly,
        low_competition=low_competition,
        recently_posted=recently_posted,
        competition_level=competition_level,
        sort=sort,
    )
    if res.total == 0 and not q and not skills and not location:
        try:
            from scripts.seed_data import seed_all
            await seed_all()
            res = await search_jobs(
                db=db,
                pagination=pagination,
                q=q,
                location=location,
                job_type=job_type,
                work_mode=work_mode,
                remote=remote,
                company_type=company_type,
                salary_min=salary_min,
                salary_max=salary_max,
                experience_level=experience_level,
                skills=skills,
                skills_match=skills_match,
                fresher_friendly=fresher_friendly,
                low_competition=low_competition,
                recently_posted=recently_posted,
                competition_level=competition_level,
                sort=sort,
            )
        except Exception:
            pass
    return res


@router.get(
    "/mine",
    response_model=Page[JobCardResponse],
    summary="Jobs posted by me (recruiter)",
)
@router.get(
    "/my-jobs",
    response_model=Page[JobCardResponse],
    summary="Jobs posted by me alias",
)
async def list_my_jobs(
    user: Annotated[User, Depends(require_recruiter_or_admin)],
    db: AsyncSession = Depends(get_db),
    pagination: PaginationDep = None,  # type: ignore[assignment]
) -> Page[JobCardResponse]:
    rows, total = await JobService(db).list_mine(
        user, page=pagination.page, page_size=pagination.page_size
    )
    pages = (
        (total + pagination.page_size - 1) // pagination.page_size
        if pagination.page_size
        else 0
    )
    return Page[JobCardResponse](
        items=[_job_card(j) for j in rows],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages,
    )


@router.get("/applications", summary="My applications alias")
async def list_jobs_applications(
    pagination: PaginationDep,
    db: AsyncSession = Depends(get_db),
    status_filter: str | None = Query(default=None, alias="status"),
    current_user: OptionalUser = None,
):
    from app.services.application_service import ApplicationService
    from app.api.v1.applications import _to_response
    if not current_user:
        return {"items": [], "applications": [], "total": 0, "page": 1, "page_size": 20, "pages": 0}
    rows, total = await ApplicationService(db).list_mine(
        user=current_user,
        status=status_filter,
        page=pagination.page if pagination else 1,
        page_size=pagination.page_size if pagination else 20,
    )
    pages = (total + pagination.page_size - 1) // pagination.page_size if pagination and pagination.page_size else 0
    items = [_to_response(r).model_dump() for r in rows]
    return {
        "items": items,
        "applications": items,
        "total": total,
        "page": pagination.page if pagination else 1,
        "page_size": pagination.page_size if pagination else 20,
        "pages": pages,
    }


@router.get("/saved", summary="My saved jobs alias")
async def list_jobs_saved(
    pagination: PaginationDep,
    db: AsyncSession = Depends(get_db),
    current_user: OptionalUser = None,
):
    from app.services.swipe_service import SwipeService
    from app.schemas.swipe import SavedJobResponse
    if not current_user:
        return {"items": [], "saved_jobs": [], "jobs": [], "total": 0, "page": 1, "page_size": 20, "pages": 0}
    items, total = await SwipeService(db).list_saved(
        user=current_user, page=pagination.page if pagination else 1, page_size=pagination.page_size if pagination else 20
    )
    pages = (total + pagination.page_size - 1) // pagination.page_size if pagination and pagination.page_size else 0
    serialized = [SavedJobResponse(job_id=i["job_id"], saved_at=i["saved_at"]).model_dump() for i in items]
    return {
        "items": serialized,
        "saved_jobs": serialized,
        "jobs": serialized,
        "total": total,
        "page": pagination.page if pagination else 1,
        "page_size": pagination.page_size if pagination else 20,
        "pages": pages,
    }


@router.get("/swipes", summary="My swipe history alias")
async def list_jobs_swipes(
    pagination: PaginationDep,
    db: AsyncSession = Depends(get_db),
    current_user: OptionalUser = None,
):
    from app.services.swipe_service import SwipeService
    if not current_user:
        return {"items": [], "swipes": [], "total": 0, "page": 1, "page_size": 100, "pages": 0}
    items, total = await SwipeService(db).history(
        user=current_user, page=pagination.page if pagination else 1, page_size=pagination.page_size if pagination else 100
    )
    pages = (total + 99) // 100 if total else 0
    serialized = [
        {
            "job_id": i["job_id"],
            "direction": i["direction"],
            "action": i["action"],
            "swiped_at": i["swiped_at"].isoformat() if hasattr(i["swiped_at"], "isoformat") else str(i["swiped_at"]),
        }
        for i in items
    ]
    return {
        "items": serialized,
        "swipes": serialized,
        "total": total,
        "page": 1,
        "page_size": 100,
        "pages": pages,
    }


@router.get("/{job_id}", response_model=JobResponse, summary="Get job detail")
async def get_job(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> JobResponse:
    job = await JobService(db).get(job_id)
    return _job_response(job)


@router.post("/{job_id}/swipe", summary="Record a swipe on a job")
async def swipe_job_by_id(
    job_id: uuid.UUID,
    payload: dict,
    user: Annotated[User, Depends(require_job_seeker)],
    db: AsyncSession = Depends(get_db),
):
    from app.services.swipe_service import SwipeService
    from app.models.enums import SwipeAction, SwipeDirection
    action_str = str(payload.get("action", "LEFT")).upper()
    direction = SwipeDirection.right if action_str == "RIGHT" else SwipeDirection.left
    action = SwipeAction.apply if direction == SwipeDirection.right else SwipeAction.skip
    data = await SwipeService(db).record(
        user=user,
        job_id=job_id,
        direction=direction,
        action=action,
    )
    return {
        "job_id": data["job_id"],
        "direction": data["direction"],
        "action": data["action"],
        "swiped_at": data["swiped_at"],
    }



@router.get(
    "/{job_id}/competition",
    response_model=JobCompetitionResponse,
    summary="Get job competition snapshot",
)
async def get_job_competition(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> JobCompetitionResponse:
    data = await JobService(db).get_competition(job_id)
    return JobCompetitionResponse(
        applicant_count=data["applicant_count"],
        competition_level=CompetitionLevel(data["competition_level"]),
        posted_at=data["posted_at"],
        hours_since_posted=data["hours_since_posted"],
        early_window_open=data["early_window_open"],
    )


@router.post(
    "",
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a job (recruiter/admin)",
)
async def create_job(
    payload: JobCreate,
    user: CurrentUser,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> JobResponse:
    job = await JobService(db).create(user, payload)
    # refresh with company loaded
    job = await JobService(db).get(job.id)
    # Fire high-match / low-competition / startup / instant-job alerts after the response.
    background_tasks.add_task(run_job_created_alerts, job.id)
    return _job_response(job)


@router.patch("/{job_id}", response_model=JobResponse, summary="Update a job (owner or admin)")
async def update_job(
    job_id: uuid.UUID,
    payload: JobUpdate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> JobResponse:
    job = await JobService(db).update(user, job_id, payload)
    job = await JobService(db).get(job.id)
    return _job_response(job)


@router.delete(
    "/{job_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Soft-delete a job",
)
async def delete_job(
    job_id: uuid.UUID,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> Response:
    await JobService(db).soft_delete(user, job_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.get(
    "/{job_id}/applicants",
    summary="List applicants for a job (owner recruiter/admin)",
)
async def list_applicants(
    job_id: uuid.UUID,
    user: Annotated[User, Depends(require_recruiter_or_admin)],
    db: AsyncSession = Depends(get_db),
    pagination: PaginationDep = None,  # type: ignore[assignment]
) -> dict:
    from app.services.application_service import ApplicationService

    rows, total = await ApplicationService(db).list_for_job(
        user=user, job_id=job_id, page=pagination.page, page_size=pagination.page_size
    )
    pages = (
        (total + pagination.page_size - 1) // pagination.page_size
        if pagination.page_size
        else 0
    )
    return {
        "items": [
            {
                "application_id": str(a.id),
                "user_id": str(a.user_id),
                "status": a.status,
                "is_early_applicant": a.is_early_applicant,
                "applied_at": a.applied_at.isoformat() if a.applied_at else None,
                "created_at": a.created_at.isoformat(),
            }
            for a in rows
        ],
        "total": total,
        "page": pagination.page,
        "page_size": pagination.page_size,
        "pages": pages,
    }