"""Time helpers for freshness and competition windows."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def hours_since(dt: datetime) -> float:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return (now_utc() - dt).total_seconds() / 3600.0


def days_since(dt: datetime) -> float:
    return hours_since(dt) / 24.0


def is_fresh(posted_at: datetime, fresh_days: int) -> bool:
    return days_since(posted_at) <= fresh_days


def early_window_open(posted_at: datetime, window_hours: int) -> bool:
    return hours_since(posted_at) <= window_hours


def utc_now_plus(**kwargs) -> datetime:
    return now_utc() + timedelta(**kwargs)