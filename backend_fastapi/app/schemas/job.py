"""Job schemas, including card and detail responses."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import CompetitionLevel, ExperienceLevel, JobType, WorkMode
from app.schemas.company import CompanySummary


class JobBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1)
    job_type: JobType = JobType.full_time
    work_mode: WorkMode = WorkMode.onsite
    location: str | None = Field(default=None, max_length=200)
    salary_min: int | None = Field(default=None, ge=0)
    salary_max: int | None = Field(default=None, ge=0)
    salary_currency: str = Field(default="INR", max_length=8)
    experience_level: ExperienceLevel = ExperienceLevel.mid
    min_experience_years: int | None = Field(default=None, ge=0, le=60)
    skills: list[str] = Field(default_factory=list)
    required_skills: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    expires_at: datetime | None = None

    @model_validator(mode="after")
    def _check_salary(self):
        if self.salary_min is not None and self.salary_max is not None:
            if self.salary_max < self.salary_min:
                raise ValueError("salary_max must be >= salary_min")
        return self


class JobCreate(JobBase):
    company_id: str


class JobUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    job_type: JobType | None = None
    work_mode: WorkMode | None = None
    location: str | None = None
    salary_min: int | None = Field(default=None, ge=0)
    salary_max: int | None = Field(default=None, ge=0)
    salary_currency: str | None = None
    experience_level: ExperienceLevel | None = None
    min_experience_years: int | None = Field(default=None, ge=0, le=60)
    skills: list[str] | None = None
    required_skills: list[str] | None = None
    keywords: list[str] | None = None
    tags: list[str] | None = None
    expires_at: datetime | None = None
    is_active: bool | None = None


class JobCardResponse(BaseModel):
    """Lean job representation for the swipe deck and search results."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    company: CompanySummary
    job_type: JobType
    work_mode: WorkMode
    is_remote: bool
    location: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    salary_currency: str = "INR"
    experience_level: ExperienceLevel
    min_experience_years: int | None = None
    skills: list[str] = Field(default_factory=list)
    is_fresher_friendly: bool
    posted_at: datetime
    competition_level: CompetitionLevel
    applicant_count: int
    is_fresh: bool
    is_early_window_open: bool
    match_score: float | None = None
    reason_tags: list[str] = Field(default_factory=list)


class JobResponse(JobBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company: CompanySummary
    is_remote: bool
    is_fresher_friendly: bool
    posted_at: datetime
    is_active: bool
    applicant_count: int
    competition_level: CompetitionLevel
    is_fresh: bool
    is_early_window_open: bool
    hours_since_posted: float
    created_at: datetime
    updated_at: datetime


class JobCompetitionResponse(BaseModel):
    applicant_count: int
    competition_level: CompetitionLevel
    posted_at: datetime
    hours_since_posted: float
    early_window_open: bool