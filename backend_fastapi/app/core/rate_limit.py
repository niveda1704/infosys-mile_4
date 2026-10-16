"""Slowapi limiter with Redis storage and automatic in-memory fallback."""
from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings


def _storage_uri() -> str:
    if settings.REDIS_URL:
        return settings.REDIS_URL
    return "memory://"


# NOTE: ``headers_enabled`` is deliberately False. With it enabled slowapi requires
# every decorated handler to accept a ``response: Response`` parameter, otherwise it
# raises at request time. The per-route limits (RATE_LIMIT_AUTH) are enforced via
# ``@limiter.limit`` decorators on the auth routes.
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=_storage_uri(),
    headers_enabled=False,
    in_memory_fallback_enabled=True,
    swallow_errors=True,
)
