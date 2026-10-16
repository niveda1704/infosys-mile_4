"""Application schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ApplicationStatus


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus
    note: str | None = Field(default=None, max_length=500)


class ApplicationCreate(BaseModel):
    job_id: str
    resume_version_id: str | None = None


class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    job_id: str
    resume_version_id: str | None = None
    status: ApplicationStatus
    is_early_applicant: bool
    applied_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    title: str | None = None
    job_title: str | None = None
    company: str | None = None
    company_name: str | None = None
    location: str | None = None
    salary: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    skills: list[str] = Field(default_factory=list)
    match_percentage: float | None = 85.0


class ApplicationStatusEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    application_id: str
    from_status: str | None = None
    to_status: str
    changed_by_id: str | None = None
    note: str | None = None
    created_at: datetime


class ApplicationBoardColumn(BaseModel):
    status: ApplicationStatus
    count: int
    items: list[ApplicationResponse]


class ApplicationBoardResponse(BaseModel):
    columns: list[ApplicationBoardColumn]