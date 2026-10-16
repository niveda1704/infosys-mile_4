"""Swipe and saved-job schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import SwipeAction, SwipeDirection


class SwipeCreate(BaseModel):
    job_id: str
    direction: SwipeDirection
    action: SwipeAction | None = Field(
        default=None,
        description="Optional. Defaults: right→apply, left→skip.",
    )


class SwipeResponse(BaseModel):
    swipe_id: str
    job_id: str
    direction: SwipeDirection
    action: SwipeAction
    swiped_at: datetime


class SwipeHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    job_id: str
    direction: SwipeDirection
    action: SwipeAction
    swiped_at: datetime


class SavedJobResponse(BaseModel):
    job_id: str
    saved_at: datetime
    id: str | None = None
    title: str | None = None
    job_title: str | None = None
    company: str | None = None
    company_name: str | None = None
    location: str | None = None
    salary: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    skills: list[str] = Field(default_factory=list)