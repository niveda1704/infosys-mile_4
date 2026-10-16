"""Recommendation schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import (
    CompanyType,
    CompetitionLevel,
    ExperienceLevel,
    JobType,
    WorkMode,
)


class RecommendationCompany(BaseModel):
    id: str | None = None
    name: str | None = None
    slug: str | None = None
    logo_url: str | None = None
    company_type: CompanyType | None = None


class RecommendationJob(BaseModel):
    id: str
    title: str
    description: str
    job_type: JobType
    work_mode: WorkMode
    is_remote: bool
    location: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    experience_level: ExperienceLevel
    min_experience_years: int | None = None
    skills: list[str] = Field(default_factory=list)
    required_skills: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    is_fresher_friendly: bool
    competition_level: CompetitionLevel
    applicant_count: int
    is_fresh: bool
    posted_at: datetime
    company: RecommendationCompany


class RecommendationItem(BaseModel):
    job_id: str
    match_percentage: float
    reason_tags: list[str] = Field(default_factory=list)
    generated_by: str
    job: RecommendationJob