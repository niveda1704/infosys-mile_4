"""Notification tests: list, mark read, preferences, quiet hours, dedupe."""
from __future__ import annotations

import pytest

from app.models.enums import NotificationChannel, NotificationType, UserRole


@pytest.mark.asyncio
async def test_create_and_list_notifications(client, user_factory, auth_headers, db_session):
    user, _ = await user_factory(email="nt1@example.com", role=UserRole.job_seeker)
    from app.services.notification_service import NotificationService

    svc = NotificationService(db_session)
    await svc.create(
        user_id=user.id,
        ntype=NotificationType.system.value,
        title="Welcome",
        body="Hello",
    )
    await db_session.commit()

    headers = await auth_headers["login"]("nt1@example.com", "Passw0rd!")
    r = await client.get("/api/v1/notifications", headers=headers)
    assert r.status_code == 200
    assert r.json()["total"] == 1
    assert r.json()["items"][0]["title"] == "Welcome"

    u = await client.get("/api/v1/notifications/unread-count", headers=headers)
    assert u.json()["unread_count"] == 1

    nid = r.json()["items"][0]["id"]
    m = await client.patch(f"/api/v1/notifications/{nid}/read", headers=headers)
    assert m.status_code == 200
    assert m.json()["is_read"] is True

    u2 = await client.get("/api/v1/notifications/unread-count", headers=headers)
    assert u2.json()["unread_count"] == 0


@pytest.mark.asyncio
async def test_dedupe_prevents_duplicates(client, user_factory, db_session):
    user, _ = await user_factory(email="nt2@example.com", role=UserRole.job_seeker)
    from app.services.notification_service import NotificationService

    svc = NotificationService(db_session)
    r1 = await svc.create(
        user_id=user.id,
        ntype=NotificationType.high_match.value,
        title="X",
        body="Y",
        dedupe_key="hm:abc",
    )
    r2 = await svc.create(
        user_id=user.id,
        ntype=NotificationType.high_match.value,
        title="X",
        body="Y",
        dedupe_key="hm:abc",
    )
    assert r1.id == r2.id


@pytest.mark.asyncio
async def test_preferences_round_trip(client, user_factory, auth_headers):
    await user_factory(email="nt3@example.com", role=UserRole.job_seeker)
    headers = await auth_headers["login"]("nt3@example.com", "Passw0rd!")

    r = await client.get("/api/v1/notifications/preferences", headers=headers)
    assert r.status_code == 200
    assert r.json()["match_threshold"] == 80

    u = await client.put(
        "/api/v1/notifications/preferences",
        headers=headers,
        json={
            "enabled_types": ["instant_job", "high_match"],
            "channels": ["in_app", "email"],
            "match_threshold": 70,
            "quiet_hours_start": "22:00:00",
            "quiet_hours_end": "06:00:00",
            "timezone": "Asia/Kolkata",
        },
    )
    assert u.status_code == 200
    assert u.json()["match_threshold"] == 70
    assert set(u.json()["enabled_types"]) == {"instant_job", "high_match"}


@pytest.mark.asyncio
async def test_device_token_register_and_delete(client, user_factory, auth_headers):
    await user_factory(email="nt4@example.com", role=UserRole.job_seeker)
    headers = await auth_headers["login"]("nt4@example.com", "Passw0rd!")
    r = await client.post(
        "/api/v1/notifications/device-tokens",
        headers=headers,
        json={"token": "tok-abc-123456", "platform": "web"},
    )
    assert r.status_code == 201
    d = await client.delete("/api/v1/notifications/device-tokens/tok-abc-123456", headers=headers)
    assert d.status_code == 204


@pytest.mark.asyncio
async def test_quiet_hours_skips_email_push(client, user_factory, auth_headers, db_session):
    user, _ = await user_factory(email="nt5@example.com", role=UserRole.job_seeker)
    from datetime import datetime, timedelta
    from zoneinfo import ZoneInfo

    from app.services.notification_service import NotificationService

    svc = NotificationService(db_session)
    # Force quiet hours that include "now" in UTC
    now_utc = datetime.now(ZoneInfo("UTC")).time()
    start = (datetime.combine(datetime.utcnow().date(), now_utc) - timedelta(hours=1)).time()
    end = (datetime.combine(datetime.utcnow().date(), now_utc) + timedelta(hours=1)).time()
    await svc.update_preferences(
        user_id=user.id,
        enabled_types=[NotificationType.system.value],
        channels=[NotificationChannel.in_app.value, NotificationChannel.email.value],
        match_threshold=80,
        quiet_hours_start=start,
        quiet_hours_end=end,
        timezone_str="UTC",
    )
    await svc.create(
        user_id=user.id,
        ntype=NotificationType.system.value,
        title="Quiet test",
        body="...",
    )
    await db_session.commit()
    # Assert a delivery row exists with status 'skipped'
    from sqlalchemy import select

    from app.models.notification import NotificationDelivery

    rows = (
        await db_session.execute(
            select(NotificationDelivery).where(NotificationDelivery.status == "skipped")
        )
    ).scalars().all()
    assert any(r.channel == "email" for r in rows)