"""Notification schemas."""
from __future__ import annotations

from datetime import datetime, time

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import NotificationChannel, NotificationType


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    type: NotificationType
    title: str
    body: str
    payload: dict = Field(default_factory=dict)
    is_read: bool
    read_at: datetime | None = None
    dedupe_key: str | None = None
    created_at: datetime


class UnreadCountResponse(BaseModel):
    unread_count: int


class AlertPreferenceBase(BaseModel):
    enabled_types: list[NotificationType] = Field(default_factory=list)
    channels: list[NotificationChannel] = Field(default_factory=list)
    match_threshold: int = Field(default=80, ge=0, le=100)
    quiet_hours_start: time | None = None
    quiet_hours_end: time | None = None
    timezone: str = Field(default="UTC", max_length=64)


class AlertPreferenceUpdate(AlertPreferenceBase):
    pass


class AlertPreferenceResponse(AlertPreferenceBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str


class DeviceTokenCreate(BaseModel):
    token: str = Field(min_length=8, max_length=500)
    platform: str = Field(pattern="^(web|android|ios)$")


class DeviceTokenResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    token: str
    platform: str
    created_at: datetime