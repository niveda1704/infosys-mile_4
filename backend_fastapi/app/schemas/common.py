"""Generic pagination and error envelopes."""
from __future__ import annotations

from typing import Generic, TypeVar
from typing_extensions import Self
from pydantic import BaseModel, ConfigDict, Field, model_validator

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    model_config = ConfigDict(from_attributes=True)

    items: list[T]
    total: int
    page: int = Field(ge=1)
    page_size: int = Field(ge=1)
    pages: int = Field(ge=0)
    jobs: list[T] | None = None

    @model_validator(mode="after")
    def populate_jobs(self) -> Self:
        if self.jobs is None:
            self.jobs = self.items
        return self


class ErrorBody(BaseModel):
    code: str
    message: str
    details: object | None = None
    request_id: str | None = None


class ErrorResponse(BaseModel):
    error: ErrorBody