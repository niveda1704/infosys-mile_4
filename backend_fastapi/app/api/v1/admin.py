"""Admin endpoints: user management, aggregates, competition recompute."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, PaginationDep, get_db
from app.core.exceptions import BadRequestError, ForbiddenError, NotFoundError
from app.models.enums import UserRole
from app.repositories.user_repo import UserRepository
from app.schemas.common import Page
from app.schemas.user import UserResponse
from app.services.analytics_service import AnalyticsService
from app.services.job_service import JobService

router = APIRouter(prefix="/admin", tags=["admin"])


def _require_admin(user) -> None:
    if user.role != UserRole.admin.value:
        raise ForbiddenError("Requires role: admin")


class AdminUserUpdate(BaseModel):
    is_active: bool | None = None
    role: UserRole | None = None


class RefreshResponse(BaseModel):
    daily_job_stats_rows: int
    skill_demand_rows: int


class RecomputeResponse(BaseModel):
    updated: int


@router.get("/users", response_model=Page[UserResponse], summary="List users (admin)")
async def list_users(
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    pagination: PaginationDep = None,  # type: ignore[assignment]
    role: UserRole | None = Query(default=None),
    q: str | None = Query(default=None, max_length=200),
    is_active: bool | None = Query(default=None),
) -> Page[UserResponse]:
    _require_admin(user)
    rows, total = await UserRepository(db).list_paginated(
        role=role.value if role else None,
        q=q,
        is_active=is_active,
        page=pagination.page,
        page_size=pagination.page_size,
    )
    pages = (total + pagination.page_size - 1) // pagination.page_size if pagination.page_size else 0
    return Page[UserResponse](
        items=[
            UserResponse.model_validate(
                {
                    "id": str(u.id),
                    "email": u.email,
                    "full_name": u.full_name,
                    "role": UserRole(u.role),
                    "is_active": u.is_active,
                    "last_login_at": u.last_login_at,
                    "created_at": u.created_at,
                }
            )
            for u in rows
        ],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages,
    )


@router.patch("/users/{user_id}", response_model=UserResponse, summary="Update a user (admin)")
async def update_user(
    user_id: uuid.UUID,
    payload: AdminUserUpdate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    _require_admin(user)
    if user_id == user.id and (
        payload.is_active is False or (payload.role is not None and payload.role != UserRole.admin)
    ):
        raise BadRequestError("An admin cannot deactivate or demote themselves")
    repo = UserRepository(db)
    target = await repo.get_by_id(user_id)
    if target is None:
        raise NotFoundError("User not found")
    fields = payload.model_dump(exclude_unset=True)
    if "role" in fields and fields["role"] is not None:
        fields["role"] = fields["role"].value
    if fields:
        await repo.update_user(target, **fields)
        await db.commit()
        await db.refresh(target)
    return UserResponse.model_validate(
        {
            "id": str(target.id),
            "email": target.email,
            "full_name": target.full_name,
            "role": UserRole(target.role),
            "is_active": target.is_active,
            "last_login_at": target.last_login_at,
            "created_at": target.created_at,
        }
    )


@router.post(
    "/analytics/refresh",
    response_model=RefreshResponse,
    status_code=status.HTTP_200_OK,
    summary="Refresh analytics aggregates (admin)",
)
async def refresh_analytics(
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    days: int = Query(default=30, ge=1, le=365),
) -> RefreshResponse:
    _require_admin(user)
    data = await AnalyticsService(db).refresh_aggregates(days=days)
    return RefreshResponse(**data)


@router.post(
    "/jobs/recompute-competition",
    response_model=RecomputeResponse,
    summary="Recompute competition levels for all jobs (admin)",
)
async def recompute_competition(
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> RecomputeResponse:
    _require_admin(user)
    updated = await JobService(db).recompute_all_competition()
    return RecomputeResponse(updated=updated)