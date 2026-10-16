"""Notification service — persistence + delivery orchestration."""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, time, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations.email.base import EmailSender
from app.integrations.email.factory import get_email_sender
from app.integrations.push.base import PushSender
from app.integrations.push.factory import get_push_sender
from app.models.enums import NotificationChannel, NotificationType
from app.models.notification import (
    AlertPreference,
    DeviceToken,
    Notification,
    NotificationDelivery,
)
from app.realtime.connection_manager import connection_manager

logger = logging.getLogger(__name__)


# Reasonable defaults for the four alert types required by the charter
DEFAULT_ENABLED_TYPES = [
    NotificationType.instant_job.value,
    NotificationType.startup_hiring.value,
    NotificationType.high_match.value,
    NotificationType.low_competition.value,
]


class NotificationService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.email: EmailSender = get_email_sender()
        self.push: PushSender = get_push_sender()

    # ---------- preferences ----------
    async def get_or_create_preferences(self, user_id: uuid.UUID) -> AlertPreference:
        stmt = select(AlertPreference).where(AlertPreference.user_id == user_id)
        pref = (await self.db.execute(stmt)).scalar_one_or_none()
        if pref is not None:
            return pref
        pref = AlertPreference(
            user_id=user_id,
            enabled_types=list(DEFAULT_ENABLED_TYPES),
            channels=[NotificationChannel.in_app.value],
            match_threshold=80,
            timezone="UTC",
        )
        self.db.add(pref)
        await self.db.flush()
        return pref

    async def update_preferences(
        self,
        *,
        user_id: uuid.UUID,
        enabled_types: list[str],
        channels: list[str],
        match_threshold: int,
        quiet_hours_start: time | None,
        quiet_hours_end: time | None,
        timezone_str: str,
    ) -> AlertPreference:
        pref = await self.get_or_create_preferences(user_id)
        pref.enabled_types = enabled_types
        pref.channels = channels
        pref.match_threshold = match_threshold
        pref.quiet_hours_start = quiet_hours_start
        pref.quiet_hours_end = quiet_hours_end
        pref.timezone = timezone_str
        await self.db.flush()
        return pref

    # ---------- list ----------
    async def list_for_user(
        self,
        *,
        user_id: uuid.UUID,
        unread_only: bool = False,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Notification], int]:
        stmt = select(Notification).where(Notification.user_id == user_id)
        from sqlalchemy import func as _f

        count_stmt = (
            select(_f.count()).select_from(Notification).where(Notification.user_id == user_id)
        )
        if unread_only:
            stmt = stmt.where(Notification.is_read.is_(False))
            count_stmt = count_stmt.where(Notification.is_read.is_(False))
        stmt = stmt.order_by(Notification.created_at.desc())
        total = int((await self.db.execute(count_stmt)).scalar_one())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        rows = list((await self.db.execute(stmt)).scalars().all())
        return rows, total

    async def unread_count(self, user_id: uuid.UUID) -> int:
        from sqlalchemy import func as _f

        stmt = (
            select(_f.count())
            .select_from(Notification)
            .where(Notification.user_id == user_id, Notification.is_read.is_(False))
        )
        return int((await self.db.execute(stmt)).scalar_one())

    async def mark_read(self, *, user_id: uuid.UUID, notification_id: uuid.UUID) -> Notification | None:
        stmt = select(Notification).where(
            Notification.id == notification_id, Notification.user_id == user_id
        )
        row = (await self.db.execute(stmt)).scalar_one_or_none()
        if row is None:
            return None
        if not row.is_read:
            row.is_read = True
            row.read_at = datetime.now(timezone.utc)
            await self.db.flush()
        return row

    async def mark_all_read(self, user_id: uuid.UUID) -> int:
        from sqlalchemy import update as _u

        stmt = (
            _u(Notification)
            .where(Notification.user_id == user_id, Notification.is_read.is_(False))
            .values(is_read=True, read_at=datetime.now(timezone.utc))
        )
        result = await self.db.execute(stmt)
        return int(result.rowcount or 0)

    # ---------- creation ----------
    async def create(
        self,
        *,
        user_id: uuid.UUID,
        ntype: str,
        title: str,
        body: str,
        payload: dict | None = None,
        dedupe_key: str | None = None,
        channels: list[str] | None = None,
        respect_quiet_hours: bool = True,
    ) -> Notification:
        # Dedupe: if the same key already exists, return the existing row.
        if dedupe_key:
            stmt = select(Notification).where(
                Notification.user_id == user_id, Notification.dedupe_key == dedupe_key
            )
            existing = (await self.db.execute(stmt)).scalar_one_or_none()
            if existing is not None:
                return existing

        row = Notification(
            user_id=user_id,
            type=ntype,
            title=title,
            body=body,
            payload=payload or {},
            dedupe_key=dedupe_key,
            is_read=False,
        )
        self.db.add(row)
        await self.db.flush()

        # In-app always; email/push only if channels requested and not quiet hours
        pref = await self.get_or_create_preferences(user_id)
        active_channels = channels if channels is not None else list(pref.channels or [])
        in_quiet = respect_quiet_hours and self._in_quiet_hours(pref)
        deliveries: list[NotificationDelivery] = []

        # In-app is always attempted (DB write is the delivery).
        deliveries.append(
            NotificationDelivery(
                notification_id=row.id,
                channel=NotificationChannel.in_app.value,
                status="sent",
            )
        )

        for channel in active_channels:
            if channel == NotificationChannel.in_app.value:
                continue
            if in_quiet:
                deliveries.append(
                    NotificationDelivery(
                        notification_id=row.id,
                        channel=channel,
                        status="skipped",
                        error="quiet_hours",
                    )
                )
                continue
            status, err = await self._deliver(channel, user_id, title, body, payload or {})
            deliveries.append(
                NotificationDelivery(
                    notification_id=row.id, channel=channel, status=status, error=err
                )
            )

        for d in deliveries:
            self.db.add(d)
        await self.db.flush()

        # Live push to any open WebSocket for this user (never raises).
        try:
            unread = await self.unread_count(user_id)
            await connection_manager.send_to_user(
                user_id,
                {
                    "type": "notification",
                    "data": {
                        "id": str(row.id),
                        "type": row.type,
                        "title": row.title,
                        "body": row.body,
                        "payload": row.payload,
                        "is_read": row.is_read,
                        "created_at": row.created_at.isoformat(),
                    },
                    "unread_count": unread,
                },
            )
        except Exception:  # noqa: BLE001
            logger.exception("WS push failed for user %s", user_id)

        return row

    async def _deliver(
        self, channel: str, user_id: uuid.UUID, title: str, body: str, payload: dict
    ) -> tuple[str, str | None]:
        try:
            if channel == NotificationChannel.email.value:
                # Look up the user's email
                from app.models.user import User

                stmt = select(User).where(User.id == user_id)
                user = (await self.db.execute(stmt)).scalar_one_or_none()
                if user is None or not user.email:
                    return "skipped", "no_email"
                await self.email.send(to=user.email, subject=title, body=body)
                return "sent", None
            if channel == NotificationChannel.push.value:
                stmt = select(DeviceToken).where(DeviceToken.user_id == user_id)
                tokens = [t.token for t in (await self.db.execute(stmt)).scalars().all()]
                if not tokens:
                    return "skipped", "no_tokens"
                await self.push.send(tokens=tokens, title=title, body=body, data=payload)
                return "sent", None
            return "skipped", f"unknown_channel:{channel}"
        except Exception as exc:  # noqa: BLE001
            logger.warning("Delivery failed on %s for %s: %s", channel, user_id, exc)
            return "failed", str(exc)[:500]

    @staticmethod
    def _in_quiet_hours(pref: AlertPreference) -> bool:
        if not pref.quiet_hours_start or not pref.quiet_hours_end:
            return False
        try:
            tz = ZoneInfo(pref.timezone or "UTC")
        except Exception:  # noqa: BLE001
            tz = ZoneInfo("UTC")
        now_local = datetime.now(tz).time()
        start, end = pref.quiet_hours_start, pref.quiet_hours_end
        if start <= end:
            return start <= now_local <= end
        # Overnight window, e.g. 22:00 → 06:00
        return now_local >= start or now_local <= end

    # ---------- application status notification ----------
    async def notify_application_status(
        self, *, user_id: uuid.UUID, application_id: uuid.UUID, status: str
    ) -> None:
        title = f"Application status updated: {status}"
        body = f"Your application moved to {status}."
        payload = {"application_id": str(application_id), "status": status}
        await self.create(
            user_id=user_id,
            ntype=NotificationType.application_status.value,
            title=title,
            body=body,
            payload=payload,
            dedupe_key=None,
        )
        await self.db.commit()