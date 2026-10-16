"""Resume schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ParseStatus


class ResumeSkillResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    skill_name: str
    normalized_name: str
    category: str | None = None
    confidence: float | None = None
    years: int | None = None


class ResumeVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    resume_id: str
    version_number: int
    original_filename: str
    content_type: str
    file_size_bytes: int
    storage_key: str
    checksum_sha256: str
    parse_status: ParseStatus
    parse_error: str | None = None
    is_default: bool
    created_at: datetime
    skills: list[ResumeSkillResponse] = Field(default_factory=list)


class ResumeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    versions: list[ResumeVersionResponse] = Field(default_factory=list)


class ResumeUploadResponse(BaseModel):
    resume_id: str
    version_id: str
    version_number: int
    parse_status: ParseStatus
    skills: list[str] = Field(default_factory=list)
    parsed_skills: list[str] = Field(default_factory=list)
    resume: dict = Field(default_factory=dict)



class ResumeParseResponse(BaseModel):
    version_id: str
    parse_status: ParseStatus
    parsed_experience: dict | None = None
    skills: list[ResumeSkillResponse] = Field(default_factory=list)
    parse_error: str | None = None


class ResumeParseRequest(BaseModel):
    version_id: str | None = None


class ResumeVersionUpdate(BaseModel):
    is_default: bool = True