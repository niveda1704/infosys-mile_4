"""API v1 aggregator router."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import (
    admin,
    analytics,
    applications,
    ats,
    auth,
    companies,
    health,
    jobs,
    notifications,
    recommendations,
    resumes,
    swipes,
    users,
    ws,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(companies.router)
api_router.include_router(jobs.router)
api_router.include_router(swipes.router)
api_router.include_router(resumes.router)
api_router.include_router(ats.router)
api_router.include_router(recommendations.router)
api_router.include_router(applications.router)
api_router.include_router(notifications.router)
api_router.include_router(analytics.router)
api_router.include_router(admin.router)
api_router.include_router(ws.router)

from typing import Annotated
from fastapi import Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, require_job_seeker, require_role
from app.models.enums import UserRole
from app.models.user import User

ai_router = APIRouter(prefix="/ai", tags=["ai"])

@ai_router.get("/resume/{resume_id}/analysis")
async def ai_resume_analysis(
    resume_id: str,
    user: Annotated[User, Depends(require_job_seeker)],
    db: AsyncSession = Depends(get_db),
    mode: str = Query("hybrid"),
):
    from app.api.v1.resumes import get_resume_analysis_data
    return await get_resume_analysis_data(resume_id, user, db, mode)

@ai_router.get("/recommendations")
async def ai_recommendations(
    user: Annotated[User, Depends(require_role(UserRole.job_seeker, UserRole.admin))],
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = Query(default=20, ge=1, le=100),
    user_id: str | None = Query(default=None),
):
    from app.api.v1.recommendations import get_recommendations
    return await get_recommendations(user=user, db=db, limit=limit, user_id=user_id)

@ai_router.get("/deck")
async def ai_deck(
    user: Annotated[User, Depends(require_role(UserRole.job_seeker, UserRole.admin))],
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = Query(default=30, ge=1, le=100),
):
    from app.api.v1.recommendations import get_recommendations
    recs = await get_recommendations(user=user, db=db, limit=limit)
    order = [str(r.job_id) for r in recs]
    scores = {str(r.job_id): r.match_percentage for r in recs}
    return {
        "order": order,
        "scores": scores,
        "items": [r.model_dump() for r in recs],
    }

api_router.include_router(ai_router)