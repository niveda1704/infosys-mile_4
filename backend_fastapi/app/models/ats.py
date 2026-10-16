"""ATSScore and RecommendationEvent models."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, uuid_pk
from app.models.enums import SuggestionSource


class ATSScore(Base):
    __tablename__ = "ats_scores"

    id: Mapped[uuid.UUID] = uuid_pk()
    user_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    resume_version_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("resume_versions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    match_score: Mapped[float] = mapped_column(Float, nullable=False)
    keyword_score: Mapped[float] = mapped_column(Float, nullable=False)
    semantic_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    missing_skills: Mapped[list] = mapped_column(JSONB, nullable=False, default=list, server_default="[]")
    missing_keywords: Mapped[list] = mapped_column(JSONB, nullable=False, default=list, server_default="[]")
    suggestions: Mapped[list] = mapped_column(JSONB, nullable=False, default=list, server_default="[]")
    suggestion_source: Mapped[str] = mapped_column(
        String(32), nullable=False, default=SuggestionSource.rule_based.value,
        server_default=SuggestionSource.rule_based.value,
    )
    generated_by: Mapped[str] = mapped_column(String(64), nullable=False, default="heuristic-v0")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint("resume_version_id", "job_id", name="uq_ats_scores_version_job"),
        Index("ix_ats_scores_user_created", "user_id", "created_at"),
    )


class RecommendationEvent(Base):
    __tablename__ = "recommendation_events"

    id: Mapped[uuid.UUID] = uuid_pk()
    user_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    match_score: Mapped[float] = mapped_column(Float, nullable=False)
    reason_tags: Mapped[list] = mapped_column(JSONB, nullable=False, default=list, server_default="[]")
    generated_by: Mapped[str] = mapped_column(String(64), nullable=False, default="heuristic-v0")
    shown_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )