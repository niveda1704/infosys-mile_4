"""Push sender factory."""
from __future__ import annotations

from functools import lru_cache

from app.core.config import settings
from app.integrations.push.noop_sender import NoopSender


@lru_cache
def get_push_sender():
    if settings.PUSH_BACKEND == "fcm":
        try:
            from app.integrations.push.fcm_sender import FcmSender

            return FcmSender()
        except Exception:  # noqa: BLE001
            return NoopSender()
    return NoopSender()