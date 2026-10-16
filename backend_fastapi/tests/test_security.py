"""Security-focused tests: JWT validation, tampering, headers, request-id."""
from __future__ import annotations

import pytest


@pytest.mark.asyncio
async def test_garbage_token_rejected(client):
    r = await client.get(
        "/api/v1/auth/me", headers={"Authorization": "Bearer not.a.jwt"}
    )
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_missing_bearer_prefix_rejected(client, user_factory):
    user, pw = await user_factory(email="sec@example.com")
    r = await client.get("/api/v1/auth/me", headers={"Authorization": "Token abc"})
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_request_id_echoed(client):
    r = await client.get("/api/v1/health", headers={"X-Request-ID": "abc-123"})
    assert r.status_code == 200
    assert r.headers.get("x-request-id") == "abc-123"


@pytest.mark.asyncio
async def test_security_headers_present(client):
    r = await client.get("/api/v1/health")
    assert r.headers["x-content-type-options"] == "nosniff"
    assert r.headers["x-frame-options"] == "DENY"
    assert r.headers["referrer-policy"] == "no-referrer"
    assert "content-security-policy" in {k.lower() for k in r.headers.keys()}


@pytest.mark.asyncio
async def test_error_envelope_shape(client):
    r = await client.post(
        "/api/v1/auth/login", json={"email": "notanemail", "password": "x"}
    )
    assert r.status_code == 422
    body = r.json()
    assert "error" in body
    assert "code" in body["error"]
    assert "message" in body["error"]
    assert "request_id" in body["error"]


@pytest.mark.asyncio
async def test_expired_access_token_rejected(client, user_factory):
    from app.core.security import create_access_token

    user, _ = await user_factory(email="exp@example.com")
    # Manually sign a token that expired long ago
    token, _, _ = create_access_token(
        subject=str(user.id), role=user.role, expires_minutes=-5
    )
    r = await client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert r.status_code == 401