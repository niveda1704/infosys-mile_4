"""Security headers and request-id behaviour."""
from __future__ import annotations

import pytest


@pytest.mark.asyncio
async def test_security_headers_on_every_response(client):
    r = await client.get("/api/v1/health")
    assert r.status_code == 200
    h = {k.lower(): v for k, v in r.headers.items()}
    assert h["x-content-type-options"] == "nosniff"
    assert h["x-frame-options"] == "DENY"
    assert h["referrer-policy"] == "no-referrer"
    assert "permissions-policy" in h
    assert h["content-security-policy"] == "default-src 'none'"


@pytest.mark.asyncio
async def test_request_id_is_generated_when_absent(client):
    r = await client.get("/api/v1/health")
    assert "x-request-id" in {k.lower() for k in r.headers.keys()}


@pytest.mark.asyncio
async def test_request_id_is_echoed_when_provided(client):
    r = await client.get("/api/v1/health", headers={"X-Request-ID": "abc-456"})
    assert r.headers["x-request-id"] == "abc-456"


@pytest.mark.asyncio
async def test_request_id_in_error_envelope(client):
    r = await client.post(
        "/api/v1/auth/login",
        json={"email": "notanemail", "password": "x"},
        headers={"X-Request-ID": "trace-789"},
    )
    assert r.status_code == 422
    body = r.json()
    assert body["error"]["request_id"] == "trace-789"