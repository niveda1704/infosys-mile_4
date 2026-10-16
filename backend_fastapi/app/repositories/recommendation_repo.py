"""Recommendation event repository."""
from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ats import RecommendationEvent


class RecommendationRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_event(
        self,
        *,
        user_id: uuid.UUID,
        job_id: uuid.UUID,
        match_score: float,
        reason_tags: list[str],
        generated_by: str,
    ) -> RecommendationEvent:
        row = RecommendationEvent(
            user_id=user_id,
            job_id=job_id,
            match_score=match_score,
            reason_tags=reason_tags,
            generated_by=generated_by,
        )
        self.db.add(row)
        await self.db.flush()
        return row

    async def bulk_create(
        self, rows: list[dict]
    ) -> list[RecommendationEvent]:
        created: list[RecommendationEvent] = []
        for r in rows:
            created.append(await self.create_event(**r))
        return created

    async def recent_for_user(
        self, *, user_id: uuid.UUID, limit: int = 50
    ) -> list[RecommendationEvent]:
        stmt = (
            select(RecommendationEvent)
            .where(RecommendationEvent.user_id == user_id)
            .order_by(RecommendationEvent.shown_at.desc())
            .limit(limit)
        )
        return list((await self.db.execute(stmt)).scalars().all())

    async def top_reason_tags(
        self, *, user_id: uuid.UUID, limit: int = 5
    ) -> list[tuple[str, int]]:
        """Return most frequent reason tags for the user (for analytics)."""
        rows = await self.recent_for_user(user_id=user_id, limit=500)
        counts: dict[str, int] = {}
        for r in rows:
            for tag in (r.reason_tags or []):
                counts[tag] = counts.get(tag, 0) + 1
        return sorted(counts.items(), key=lambda kv: kv[1], reverse=True)[:limit]