"""FCM sender — firebase_admin imported lazily."""
from __future__ import annotations

import logging
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)


class FcmSender:
    def __init__(self) -> None:
        # Lazily initialized
        self._initialized = False

    def _ensure_initialized(self) -> bool:
        if self._initialized:
            return True
        if not settings.FCM_CREDENTIALS_JSON_PATH:
            return False
        try:
            import firebase_admin
            from firebase_admin import credentials

            if not firebase_admin._apps:  # noqa: SLF001
                cred = credentials.Certificate(settings.FCM_CREDENTIALS_JSON_PATH)
                firebase_admin.initialize_app(cred)
            self._initialized = True
            return True
        except Exception as exc:  # noqa: BLE001
            logger.warning("FCM initialization failed: %s", exc)
            return False

    async def send(
        self, *, tokens: list[str], title: str, body: str, data: dict[str, Any]
    ) -> None:
        if not self._ensure_initialized():
            logger.info("[push:fcm:skipped] missing credentials")
            return
        try:
            from firebase_admin import messaging

            message = messaging.MulticastMessage(
                tokens=tokens,
                notification=messaging.Notification(title=title, body=body),
                data={k: str(v) for k, v in data.items()},
            )
            messaging.send_each_for_multicast(message)
        except Exception as exc:  # noqa: BLE001
            logger.warning("FCM send failed: %s", exc)