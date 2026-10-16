"""Company schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import CompanyType


class CompanyBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    about: str | None = None
    logo_url: str | None = Field(default=None, max_length=500)
    website: str | None = Field(default=None, max_length=500)
    size_range: str | None = Field(default=None, max_length=50)
    industry: str | None = Field(default=None, max_length=120)
    company_type: CompanyType = CompanyType.startup
    is_newly_founded: bool = False
    founded_year: int | None = Field(default=None, ge=1800, le=2100)
    headquarters: str | None = Field(default=None, max_length=200)

    @field_validator("website", "logo_url")
    @classmethod
    def _strip(cls, v: str | None) -> str | None:
        return v.strip() if isinstance(v, str) else v


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    about: str | None = None
    logo_url: str | None = None
    website: str | None = None
    size_range: str | None = None
    industry: str | None = None
    company_type: CompanyType | None = None
    is_newly_founded: bool | None = None
    founded_year: int | None = Field(default=None, ge=1800, le=2100)
    headquarters: str | None = None


class CompanySummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str
    logo_url: str | None = None
    company_type: CompanyType
    is_newly_founded: bool
    industry: str | None = None


class CompanyResponse(CompanyBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    slug: str
    owner_user_id: str | None = None
    created_at: datetime
    updated_at: datetime