"""Recommendation endpoint."""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_role
from app.core.exceptions import BadRequestError, ForbiddenError
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.recommendation import RecommendationItem
from app.services.recommendation_service import RecommendationService

router = APIRouter(tags=["recommendations"])


@router.get(
    "/recommendations",
    response_model=list[RecommendationItem],
    summary="Personalized job recommendations",
)
@router.get(
    "/ai/recommendations",
    response_model=list[RecommendationItem],
    summary="Personalized job recommendations alias",
)
@router.get(
    "/ai/deck",
    response_model=list[RecommendationItem],
    summary="Swipe deck recommendations alias",
)
async def get_recommendations(
    user: Annotated[User, Depends(require_role(UserRole.job_seeker, UserRole.admin))],
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = Query(default=20, ge=1, le=100),
    user_id: str | None = Query(
        default=None,
        description="Admin-only: get recommendations for another user.",
    ),
) -> list[RecommendationItem]:
    target: uuid.UUID | None = None
    if user_id:
        if user.role != UserRole.admin.value:
            raise ForbiddenError("Only admins may pass user_id")
        try:
            target = uuid.UUID(user_id)
        except ValueError:
            raise BadRequestError("Invalid user_id")

    items = await RecommendationService(db).recommend(
        user=user, limit=limit, target_user_id=target
    )
    return [RecommendationItem(**item) for item in items]