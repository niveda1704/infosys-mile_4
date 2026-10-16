"""Aggregate tables for analytics dashboards."""
from __future__ import annotations

from datetime import date

from sqlalchemy import Date, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class DailyJobStat(Base):
    __tablename__ = "daily_job_stats"

    date: Mapped[date] = mapped_column(Date, primary_key=True)
    company_type: Mapped[str] = mapped_column(String(32), primary_key=True)
    jobs_posted: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    applications_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )


class SkillDemandDaily(Base):
    __tablename__ = "skill_demand_daily"

    date: Mapped[date] = mapped_column(Date, primary_key=True)
    skill: Mapped[str] = mapped_column(String(120), primary_key=True)
    job_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )

    __table_args__ = (Index("ix_skill_demand_daily_date", "date"),)