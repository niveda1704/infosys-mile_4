"""Rate limit tests: auth endpoints return 429 after exceeding the per-IP limit."""
from __future__ import annotations

import pytest


@pytest.mark.asyncio
async def test_login_rate_limit_returns_429(client, user_factory):
    await user_factory(email="rl@example.com")
    payload = {"email": "rl@example.com", "password": "Passw0rd!"}

    saw_429 = False
    for _ in range(25):
        r = await client.post("/api/v1/auth/login", json=payload)
        if r.status_code == 429:
            saw_429 = True
            body = r.json()
            assert body["error"]["code"] == "RATE_LIMITED"
            break
    assert saw_429, "Expected 429 after exceeding the auth rate limit"


@pytest.mark.asyncio
async def test_register_rate_limit_returns_429(client):
    saw_429 = False
    for i in range(25):
        r = await client.post(
            "/api/v1/auth/register",
            json={
                "email": f"burst{i}@example.com",
                "password": "Passw0rd!",
                "full_name": "Burst",
                "role": "job_seeker",
            },
        )
        if r.status_code == 429:
            saw_429 = True
            assert r.json()["error"]["code"] == "RATE_LIMITED"
            break
    assert saw_429