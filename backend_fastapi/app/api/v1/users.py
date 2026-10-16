"""User and profile endpoints."""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, get_db, require_job_seeker
from app.models.enums import UserRole
from app.schemas.user import (
    ExperienceCreate,
    ExperienceResponse,
    ExperienceUpdate,
    PortfolioCreate,
    PortfolioResponse,
    PortfolioUpdate,
    ProfileCreate,
    ProfileResponse,
    ProfileUpdate,
    UserResponse,
    UserUpdate,
)
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])


# ---------------- me ----------------
@router.get("/me", response_model=UserResponse, summary="Get current user")
async def get_me(user: CurrentUser) -> UserResponse:
    return UserResponse.model_validate(
        {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": UserRole(user.role),
            "is_active": user.is_active,
            "last_login_at": user.last_login_at,
            "created_at": user.created_at,
        }
    )


@router.patch("/me", response_model=UserResponse, summary="Update current user")
async def patch_me(
    payload: UserUpdate,
    user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserResponse:
    updated = await UserService(db).update_me(user, payload)
    return UserResponse.model_validate(
        {
            "id": str(updated.id),
            "email": updated.email,
            "full_name": updated.full_name,
            "role": UserRole(updated.role),
            "is_active": updated.is_active,
            "last_login_at": updated.last_login_at,
            "created_at": updated.created_at,
        }
    )


# ---------------- profile ----------------
@router.get(
    "/me/profile",
    response_model=ProfileResponse,
    summary="Get own profile (job seeker)",
)
async def get_profile(
    user: Annotated[object, Depends(require_job_seeker)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProfileResponse:
    prof = await UserService(db).get_or_create_profile(user)  # type: ignore[arg-type]
    return _profile_response(prof)


@router.put(
    "/me/profile",
    response_model=ProfileResponse,
    summary="Create or replace own profile (job seeker)",
)
async def put_profile(
    payload: ProfileCreate,
    user: Annotated[object, Depends(require_job_seeker)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProfileResponse:
    prof = await UserService(db).upsert_profile(user, payload)  # type: ignore[arg-type]
    return _profile_response(prof)


@router.patch(
    "/me/profile",
    response_model=ProfileResponse,
    summary="Patch own profile (job seeker)",
)
async def patch_profile(
    payload: ProfileUpdate,
    user: Annotated[object, Depends(require_job_seeker)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProfileResponse:
    prof = await UserService(db).upsert_profile(user, payload)  # type: ignore[arg-type]
    return _profile_response(prof)


# ---------------- experiences ----------------
@router.post(
    "/me/profile/experiences",
    response_model=ExperienceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add experience",
)
async def add_experience(
    payload: ExperienceCreate,
    user: Annotated[object, Depends(require_job_seeker)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ExperienceResponse:
    exp = await UserService(db).add_experience(user, payload)  # type: ignore[arg-type]
    return ExperienceResponse(
        id=str(exp.id),
        company_name=exp.company_name,
        title=exp.title,
        start_date=exp.start_date,
        end_date=exp.end_date,
        is_current=exp.is_current,
        description=exp.description,
        location=exp.location,
    )


@router.patch(
    "/me/profile/experiences/{exp_id}",
    response_model=ExperienceResponse,
    summary="Update experience",
)
async def patch_experience(
    exp_id: uuid.UUID,
    payload: ExperienceUpdate,
    user: Annotated[object, Depends(require_job_seeker)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ExperienceResponse:
    exp = await UserService(db).update_experience(user, exp_id, payload)  # type: ignore[arg-type]
    return ExperienceResponse(
        id=str(exp.id),
        company_name=exp.company_name,
        title=exp.title,
        start_date=exp.start_date,
        end_date=exp.end_date,
        is_current=exp.is_current,
        description=exp.description,
        location=exp.location,
    )


@router.delete(
    "/me/profile/experiences/{exp_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Delete experience",
)
async def delete_experience(
    exp_id: uuid.UUID,
    user: Annotated[object, Depends(require_job_seeker)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    await UserService(db).delete_experience(user, exp_id)  # type: ignore[arg-type]
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------- portfolio ----------------
@router.post(
    "/me/profile/portfolio",
    response_model=PortfolioResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add portfolio item",
)
async def add_portfolio(
    payload: PortfolioCreate,
    user: Annotated[object, Depends(require_job_seeker)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> PortfolioResponse:
    item = await UserService(db).add_portfolio(user, payload)  # type: ignore[arg-type]
    return PortfolioResponse(
        id=str(item.id),
        title=item.title,
        url=item.url,
        description=item.description,
        kind=item.kind,
    )


@router.patch(
    "/me/profile/portfolio/{item_id}",
    response_model=PortfolioResponse,
    summary="Update portfolio item",
)
async def patch_portfolio(
    item_id: uuid.UUID,
    payload: PortfolioUpdate,
    user: Annotated[object, Depends(require_job_seeker)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> PortfolioResponse:
    item = await UserService(db).update_portfolio(user, item_id, payload)  # type: ignore[arg-type]
    return PortfolioResponse(
        id=str(item.id),
        title=item.title,
        url=item.url,
        description=item.description,
        kind=item.kind,
    )


@router.delete(
    "/me/profile/portfolio/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Delete portfolio item",
)
async def delete_portfolio(
    item_id: uuid.UUID,
    user: Annotated[object, Depends(require_job_seeker)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    await UserService(db).delete_portfolio(user, item_id)  # type: ignore[arg-type]
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------- helper ----------------
def _profile_response(prof) -> ProfileResponse:
    return ProfileResponse(
        id=str(prof.id),
        user_id=str(prof.user_id),
        headline=prof.headline,
        bio=prof.bio,
        phone=prof.phone,
        location=prof.location,
        avatar_url=prof.avatar_url,
        experience_level=prof.experience_level,
        years_experience=prof.years_experience,
        skills=list(prof.skills or []),
        preferred_job_types=list(prof.preferred_job_types or []),
        preferred_locations=list(prof.preferred_locations or []),
        expected_salary_min=prof.expected_salary_min,
        expected_salary_max=prof.expected_salary_max,
        open_to_remote=prof.open_to_remote,
        experiences=[
            ExperienceResponse(
                id=str(e.id),
                company_name=e.company_name,
                title=e.title,
                start_date=e.start_date,
                end_date=e.end_date,
                is_current=e.is_current,
                description=e.description,
                location=e.location,
            )
            for e in (prof.experiences or [])
        ],
        portfolio=[
            PortfolioResponse(
                id=str(p.id),
                title=p.title,
                url=p.url,
                description=p.description,
                kind=p.kind,
            )
            for p in (prof.portfolio or [])
        ],
    )