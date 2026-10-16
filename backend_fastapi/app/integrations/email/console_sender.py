"""Dev console email sender."""
from __future__ import annotations

import logging

logger = logging.getLogger(__name__)


class ConsoleSender:
    async def send(self, *, to: str, subject: str, body: str) -> None:
        logger.info("[email:console] to=%s subject=%s body=%s", to, subject, body)