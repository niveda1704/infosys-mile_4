"""Analytics endpoints — role-scoped."""
from __future__ import annotations

from datetime import date, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, get_db, require_role
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.analytics import (
    AdminAnalytics,
    ApplicationFunnel,
    ApplicantsPerJob,
    ApplicationsOverTimeItem,
    HiringTrendsResponse,
    JobSeekerAnalytics,
    JobsOverTimeItem,
    RecommendationInsights,
    RecruiterAnalytics,
    ReasonTagCount,
    ResumePerformanceItem,
    SkillGapItem,
    SwipesByDirection,
)
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get(
    "/job-seeker",
    response_model=JobSeekerAnalytics,
    summary="Job seeker analytics (job seeker only)",
)
async def job_seeker_analytics(
    user: Annotated[User, Depends(require_role(UserRole.job_seeker))],
    db: AsyncSession = Depends(get_db),
) -> JobSeekerAnalytics:
    data = await AnalyticsService(db).job_seeker(user=user)
    return JobSeekerAnalytics(
        application_funnel=ApplicationFunnel(**data["application_funnel"]),
        swipes_by_direction=SwipesByDirection(**data["swipes_by_direction"]),
        resume_performance=[ResumePerformanceItem(**r) for r in data["resume_performance"]],
        skill_gap=[SkillGapItem(**s) for s in data["skill_gap"]],
        recommendation_insights=RecommendationInsights(
            avg_match_score=data["recommendation_insights"]["avg_match_score"],
            top_reason_tags=[
                ReasonTagCount(**t)
                for t in data["recommendation_insights"]["top_reason_tags"]
            ],
            right_swipe_rate=data["recommendation_insights"]["right_swipe_rate"],
        ),
    )


@router.get(
    "/recruiter",
    response_model=RecruiterAnalytics,
    summary="Recruiter analytics (recruiter only)",
)
async def recruiter_analytics(
    user: Annotated[User, Depends(require_role(UserRole.recruiter))],
    db: AsyncSession = Depends(get_db),
) -> RecruiterAnalytics:
    data = await AnalyticsService(db).recruiter(user=user)
    return RecruiterAnalytics(
        applicants_per_job=[ApplicantsPerJob(**a) for a in data["applicants_per_job"]],
        status_funnel=ApplicationFunnel(**data["status_funnel"]),
        applications_over_time=[
            ApplicationsOverTimeItem(**o) for o in data["applications_over_time"]
        ],
    )


@router.get(
    "/admin",
    response_model=AdminAnalytics,
    summary="Platform-wide analytics (admin only)",
)
async def admin_analytics(
    user: Annotated[User, Depends(require_role(UserRole.admin))],
    db: AsyncSession = Depends(get_db),
) -> AdminAnalytics:
    data = await AnalyticsService(db).admin()
    return AdminAnalytics(**data)


@router.get(
    "/hiring-trends",
    response_model=HiringTrendsResponse,
    summary="Hiring trends (any authenticated user)",
)
async def hiring_trends(
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    from_date: date = Query(
        alias="from", default_factory=lambda: date.today() - timedelta(days=30)
    ),
    to_date: date = Query(alias="to", default_factory=date.today),
    granularity: str = Query(default="day", pattern="^(day|week)$"),
) -> HiringTrendsResponse:
    data = await AnalyticsService(db).hiring_trends(
        from_date=from_date, to_date=to_date, granularity=granularity
    )
    return HiringTrendsResponse(
        **{
            "from": data["from"],
            "to": data["to"],
            "granularity": data["granularity"],
            "jobs_over_time": [JobsOverTimeItem(**j) for j in data["jobs_over_time"]],
            "top_skills": [SkillGapItem(**s) for s in data["top_skills"]],
            "activity_by_company_type": data["activity_by_company_type"],
        }
    )