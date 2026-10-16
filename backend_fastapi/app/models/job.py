"""Job model with indexes and CHECK constraints."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, uuid_pk
from app.models.enums import CompetitionLevel, ExperienceLevel, JobType, WorkMode


class Job(Base, TimestampMixin):
    __tablename__ = "jobs"

    id: Mapped[uuid.UUID] = uuid_pk()
    company_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    posted_by_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    job_type: Mapped[JobType] = mapped_column(
        String(32), nullable=False, default=JobType.full_time,
        server_default=JobType.full_time.value,
    )
    work_mode: Mapped[WorkMode] = mapped_column(
        String(32), nullable=False, default=WorkMode.onsite,
        server_default=WorkMode.onsite.value,
    )
    is_remote: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false", index=True
    )
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    salary_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    salary_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    salary_currency: Mapped[str] = mapped_column(
        String(8), nullable=False, default="INR", server_default="INR"
    )
    experience_level: Mapped[ExperienceLevel] = mapped_column(
        String(32), nullable=False, default=ExperienceLevel.mid,
        server_default=ExperienceLevel.mid.value,
    )
    min_experience_years: Mapped[int | None] = mapped_column(Integer, nullable=True)
    skills: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, default=list, server_default="{}"
    )
    required_skills: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, default=list, server_default="{}"
    )
    keywords: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, default=list, server_default="{}"
    )
    tags: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, default=list, server_default="{}"
    )
    is_fresher_friendly: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false", index=True
    )
    posted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true", index=True
    )
    applicant_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    competition_level: Mapped[CompetitionLevel] = mapped_column(
        String(16), nullable=False, default=CompetitionLevel.low,
        server_default=CompetitionLevel.low.value, index=True,
    )

    company: Mapped["Company"] = relationship(  # noqa: F821
        back_populates="jobs", lazy="raise"
    )

    __table_args__ = (
        CheckConstraint("applicant_count >= 0", name="applicant_count_non_negative"),
        CheckConstraint(
            "salary_min IS NULL OR salary_max IS NULL OR salary_max >= salary_min",
            name="salary_range_valid",
        ),
        Index("ix_jobs_active_posted", "is_active", "posted_at"),
        Index("ix_jobs_company_active", "company_id", "is_active"),
        Index("ix_jobs_competition_posted", "competition_level", "posted_at"),
        Index("ix_jobs_title_trgm", "title", postgresql_using="gin",
              postgresql_ops={"title": "gin_trgm_ops"}),
        Index("ix_jobs_description_trgm", "description", postgresql_using="gin",
              postgresql_ops={"description": "gin_trgm_ops"}),
        Index("ix_jobs_location_trgm", "location", postgresql_using="gin",
              postgresql_ops={"location": "gin_trgm_ops"}),
        Index("ix_jobs_skills_gin", "skills", postgresql_using="gin"),
        Index("ix_jobs_required_skills_gin", "required_skills", postgresql_using="gin"),
        Index("ix_jobs_keywords_gin", "keywords", postgresql_using="gin"),
        Index("ix_jobs_tags_gin", "tags", postgresql_using="gin"),
    )