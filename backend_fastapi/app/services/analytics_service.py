"""Analytics service — orchestration over AnalyticsRepository."""
from __future__ import annotations

from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestError
from app.models.user import User
from app.repositories.analytics_repo import AnalyticsRepository


class AnalyticsService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = AnalyticsRepository(db)

    # ---------- refresh ----------
    async def refresh_aggregates(self, *, days: int = 30) -> dict:
        n1 = await self.repo.refresh_daily_job_stats(days=days)
        n2 = await self.repo.refresh_skill_demand(days=days)
        await self.db.commit()
        return {"daily_job_stats_rows": n1, "skill_demand_rows": n2}

    # ---------- job seeker ----------
    async def job_seeker(self, *, user: User) -> dict:
        return {
            "application_funnel": await self.repo.application_funnel(user.id),
            "swipes_by_direction": await self.repo.swipes_by_direction(user.id),
            "resume_performance": await self.repo.resume_performance(user.id),
            "skill_gap": await self.repo.skill_gap(user.id),
            "recommendation_insights": await self.repo.recommendation_insights(user.id),
        }

    # ---------- recruiter ----------
    async def recruiter(self, *, user: User) -> dict:
        return await self.repo.recruiter_overview(recruiter_id=user.id)

    # ---------- admin ----------
    async def admin(self) -> dict:
        return await self.repo.admin_overview()

    # ---------- hiring trends ----------
    async def hiring_trends(
        self, *, from_date: date, to_date: date, granularity: str
    ) -> dict:
        if from_date > to_date:
            raise BadRequestError("from must be <= to")
        if (to_date - from_date).days > 365:
            raise BadRequestError("Range cannot exceed 365 days")
        if granularity not in ("day", "week"):
            raise BadRequestError("granularity must be day or week")
        return await self.repo.hiring_trends(
            from_date=from_date, to_date=to_date, granularity=granularity
        )

    # ---------- aggregate reads ----------
    async def daily_stats(self, *, days: int = 30) -> list[dict]:
        return await self.repo.daily_stats(days=days)

    async def top_skill_demand(self, *, days: int = 30, limit: int = 10) -> list[dict]:
        return await self.repo.top_skill_demand(days=days, limit=limit)