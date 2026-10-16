"""Email sender factory."""
from __future__ import annotations

from functools import lru_cache

from app.core.config import settings
from app.integrations.email.console_sender import ConsoleSender


@lru_cache
def get_email_sender():
    if settings.EMAIL_BACKEND == "smtp":
        try:
            from app.integrations.email.smtp_sender import SmtpSender

            return SmtpSender()
        except Exception:  # noqa: BLE001
            return ConsoleSender()
    return ConsoleSender()