"""ATS score and suggestion schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import SuggestionSource


class ATSScoreRequest(BaseModel):
    resume_id: str | None = None
    resume_version_id: str | None = None
    job_id: str

    def model_post_init(self, __context) -> None:
        if not self.resume_id and not self.resume_version_id:
            raise ValueError("Provide either resume_id or resume_version_id")


class ATSScoreResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str | None = None
    user_id: str | None = None
    resume_version_id: str
    job_id: str
    match_score: float
    keyword_score: float
    semantic_score: float | None = None
    missing_skills: list[str] = Field(default_factory=list)
    missing_keywords: list[str] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)
    suggestion_source: SuggestionSource = SuggestionSource.rule_based
    generated_by: str
    below_threshold: bool = False
    created_at: datetime | None = None


class ATSSuggestionRequest(BaseModel):
    resume_version_id: str
    job_id: str


class ATSSuggestionResponse(BaseModel):
    suggestions: list[str]
    suggestion_source: SuggestionSource