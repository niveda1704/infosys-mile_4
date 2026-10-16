"""Analytics response schemas."""
from __future__ import annotations

from datetime import date

from pydantic import BaseModel, Field


class ApplicationFunnel(BaseModel):
    saved: int = 0
    applied: int = 0
    shortlisted: int = 0
    interview: int = 0
    rejected: int = 0


class SwipesByDirection(BaseModel):
    right: int = 0
    left: int = 0


class ResumePerformanceItem(BaseModel):
    resume_version_id: str
    avg_ats_score: float | None = None
    scores_count: int
    applies: int
    shortlists: int
    interviews: int
    rejections: int


class SkillGapItem(BaseModel):
    skill: str
    count: int


class ReasonTagCount(BaseModel):
    tag: str
    count: int


class RecommendationInsights(BaseModel):
    avg_match_score: float
    top_reason_tags: list[ReasonTagCount] = Field(default_factory=list)
    right_swipe_rate: float


class JobSeekerAnalytics(BaseModel):
    application_funnel: ApplicationFunnel
    swipes_by_direction: SwipesByDirection
    resume_performance: list[ResumePerformanceItem]
    skill_gap: list[SkillGapItem]
    recommendation_insights: RecommendationInsights


class ApplicantsPerJob(BaseModel):
    job_id: str
    title: str | None = None
    applicants: int


class ApplicationsOverTimeItem(BaseModel):
    date: str
    count: int


class RecruiterAnalytics(BaseModel):
    applicants_per_job: list[ApplicantsPerJob]
    status_funnel: ApplicationFunnel
    applications_over_time: list[ApplicationsOverTimeItem]


class AdminAnalytics(BaseModel):
    users_by_role: dict[str, int]
    active_jobs: int
    total_applications: int
    total_companies: int
    active_jobs_by_company_type: dict[str, int]


class JobsOverTimeItem(BaseModel):
    bucket: str
    jobs: int


class HiringTrendsResponse(BaseModel):
    from_: date = Field(alias="from")
    to: date
    granularity: str
    jobs_over_time: list[JobsOverTimeItem]
    top_skills: list[SkillGapItem]
    activity_by_company_type: dict[str, int]

    model_config = {"populate_by_name": True}