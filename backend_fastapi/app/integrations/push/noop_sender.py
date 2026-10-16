"""No-op push sender (dev)."""
from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


class NoopSender:
    async def send(
        self, *, tokens: list[str], title: str, body: str, data: dict[str, Any]
    ) -> None:
        logger.info("[push:noop] tokens=%d title=%s", len(tokens), title)