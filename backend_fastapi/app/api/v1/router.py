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