"""AI adapter factory — selects local vs remote based on settings."""
from __future__ import annotations

import logging
from functools import lru_cache

from app.core.config import settings
from app.integrations.ai.local_adapter import LocalHeuristicAdapter
from app.integrations.ai.remote_adapter import RemoteHttpAdapter

logger = logging.getLogger(__name__)


@lru_cache
def get_ai_adapter():
    if settings.AI_MODE == "remote" and settings.AI_SERVICE_BASE_URL:
        logger.info("AI adapter: remote (%s)", settings.AI_SERVICE_BASE_URL)
        return RemoteHttpAdapter(
            base_url=settings.AI_SERVICE_BASE_URL,
            timeout=settings.AI_SERVICE_TIMEOUT_SECONDS,
        )
    logger.info("AI adapter: local heuristic")
    return LocalHeuristicAdapter()