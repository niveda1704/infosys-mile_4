"""Push port."""
from __future__ import annotations

from typing import Any, Protocol


class PushSender(Protocol):
    async def send(
        self, *, tokens: list[str], title: str, body: str, data: dict[str, Any]
    ) -> None: ...