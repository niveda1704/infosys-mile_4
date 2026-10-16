# """Auth schemas."""
# from __future__ import annotations

# import re

# from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

# from app.models.enums import UserRole

# _PASSWORD_RE = re.compile(r"^(?=.*[A-Za-z])(?=.*\d).+$")


# class RegisterRequest(BaseModel):
#     email: EmailStr
#     password: str = Field(min_length=8, max_length=128)
#     full_name: str = Field(min_length=1, max_length=200)
#     role: UserRole = UserRole.job_seeker

#     @field_validator("password")
#     @classmethod
#     def _check_password(cls, v: str) -> str:
#         if not _PASSWORD_RE.match(v):
#             raise ValueError("Password must contain at least one letter and one digit")
#         return v

#     @field_validator("role")
#     @classmethod
#     def _check_role(cls, v: UserRole) -> UserRole:
#         if v not in (UserRole.job_seeker, UserRole.recruiter):
#             raise ValueError("Registration role must be job_seeker or recruiter")
#         return v


# class RegisterResponse(BaseModel):
#     user_id: str


# class LoginRequest(BaseModel):
#     email: EmailStr
#     password: str = Field(min_length=1, max_length=128)


# class RefreshRequest(BaseModel):
#     refresh_token: str = Field(min_length=10)


# class TokenResponse(BaseModel):
#     model_config = ConfigDict(from_attributes=True)

#     access_token: str
#     refresh_token: str
#     token_type: str = "bearer"
#     role: UserRole
#     expires_in: int


# class MeResponse(BaseModel):
#     user_id: str
#     name: str
#     role: UserRole

"""Auth schemas."""
from __future__ import annotations

import re

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.enums import UserRole

_PASSWORD_RE = re.compile(r"^(?=.*[A-Za-z])(?=.*\d).+$")


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=200)
    role: UserRole = UserRole.job_seeker

    @field_validator("password")
    @classmethod
    def _check_password(cls, v: str) -> str:
        if not _PASSWORD_RE.match(v):
            raise ValueError("Password must contain at least one letter and one digit")
        return v

    @field_validator("role")
    @classmethod
    def _check_role(cls, v: UserRole) -> UserRole:
        if v not in (UserRole.job_seeker, UserRole.recruiter):
            raise ValueError("Registration role must be job_seeker or recruiter")
        return v


class RegisterResponse(BaseModel):
    user_id: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=10)


class TokenResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: UserRole
    expires_in: int


class MeResponse(BaseModel):
    user_id: str
    name: str
    role: UserRole


# Rebuild models to resolve postponed annotations for Pydantic V2 / OpenAPI generation
RegisterRequest.model_rebuild()
RegisterResponse.model_rebuild()
LoginRequest.model_rebuild()
RefreshRequest.model_rebuild()
TokenResponse.model_rebuild()
MeResponse.model_rebuild()