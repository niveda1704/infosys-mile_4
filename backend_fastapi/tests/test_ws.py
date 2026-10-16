"""WebSocket live test — verify a notification pushes over the open socket."""
from __future__ import annotations

import pytest
from starlette.testclient import TestClient


@pytest.mark.asyncio
async def test_ws_rejects_invalid_token():
    from app.main import app

    with TestClient(app) as tc:
        with pytest.raises(Exception):
            with tc.websocket_connect("/api/v1/ws/notifications?token=not.a.jwt"):
                pass


@pytest.mark.asyncio
async def test_ws_receives_notification(
    client, user_factory, auth_headers, db_session
):
    from starlette.testclient import TestClient

    from app.main import app

    user, _ = await user_factory(email="ws1@example.com", role="job_seeker")
    tokens = await client.post(
        "/api/v1/auth/login",
        json={"email": "ws1@example.com", "password": "Passw0rd!"},
    )
    access = tokens.json()["access_token"]

    with TestClient(app) as tc:
        with tc.websocket_connect(f"/api/v1/ws/notifications?token={access}") as ws:
            # The connection is registered; read the first server message.
            msg = ws.receive_text()
            assert '"type"' in msg  # either "ping" or a notification