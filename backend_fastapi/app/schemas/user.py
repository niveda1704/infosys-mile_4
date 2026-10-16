"""User and profile schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from app.models.enums import ExperienceLevel, PortfolioKind, UserRole


class UserBase(BaseModel):
    full_name: str | None = Field(default=None, max_length=200)


class UserCreate(UserBase):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: UserRole = UserRole.job_seeker


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=200)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool
    last_login_at: datetime | None = None
    created_at: datetime


class ExperienceBase(BaseModel):
    company_name: str = Field(min_length=1, max_length=200)
    title: str = Field(min_length=1, max_length=200)
    start_date: datetime | None = None
    end_date: datetime | None = None
    is_current: bool = False
    description: str | None = None
    location: str | None = Field(default=None, max_length=200)

    @model_validator(mode="after")
    def _check_dates(self):
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date must be >= start_date")
        return self


class ExperienceCreate(ExperienceBase):
    pass


class ExperienceUpdate(BaseModel):
    company_name: str | None = Field(default=None, min_length=1, max_length=200)
    title: str | None = Field(default=None, min_length=1, max_length=200)
    start_date: datetime | None = None
    end_date: datetime | None = None
    is_current: bool | None = None
    description: str | None = None
    location: str | None = None


class ExperienceResponse(ExperienceBase):
    model_config = ConfigDict(from_attributes=True)

    id: str


class PortfolioBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    url: str | None = Field(default=None, max_length=500)
    description: str | None = None
    kind: PortfolioKind = PortfolioKind.other


class PortfolioCreate(PortfolioBase):
    pass


class PortfolioUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    url: str | None = None
    description: str | None = None
    kind: PortfolioKind | None = None


class PortfolioResponse(PortfolioBase):
    model_config = ConfigDict(from_attributes=True)

    id: str


class ProfileBase(BaseModel):
    headline: str | None = Field(default=None, max_length=200)
    bio: str | None = None
    phone: str | None = Field(default=None, max_length=32)
    location: str | None = Field(default=None, max_length=200)
    avatar_url: str | None = Field(default=None, max_length=500)
    experience_level: ExperienceLevel | None = None
    years_experience: int | None = Field(default=None, ge=0, le=80)
    skills: list[str] = Field(default_factory=list)
    preferred_job_types: list[str] = Field(default_factory=list)
    preferred_locations: list[str] = Field(default_factory=list)
    expected_salary_min: int | None = Field(default=None, ge=0)
    expected_salary_max: int | None = Field(default=None, ge=0)
    open_to_remote: bool = False

    @model_validator(mode="after")
    def _check_salary(self):
        if (
            self.expected_salary_min is not None
            and self.expected_salary_max is not None
            and self.expected_salary_max < self.expected_salary_min
        ):
            raise ValueError("expected_salary_max must be >= expected_salary_min")
        return self


class ProfileCreate(ProfileBase):
    pass


class ProfileUpdate(BaseModel):
    headline: str | None = None
    bio: str | None = None
    phone: str | None = None
    location: str | None = None
    avatar_url: str | None = None
    experience_level: ExperienceLevel | None = None
    years_experience: int | None = Field(default=None, ge=0, le=80)
    skills: list[str] | None = None
    preferred_job_types: list[str] | None = None
    preferred_locations: list[str] | None = None
    expected_salary_min: int | None = Field(default=None, ge=0)
    expected_salary_max: int | None = Field(default=None, ge=0)
    open_to_remote: bool | None = None


class ProfileResponse(ProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    experiences: list[ExperienceResponse] = Field(default_factory=list)
    portfolio: list[PortfolioResponse] = Field(default_factory=list)