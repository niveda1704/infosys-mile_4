"""Auth flow tests."""
from __future__ import annotations

import pytest


@pytest.mark.asyncio
async def test_register_and_login(client):
    r = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "alice@example.com",
            "password": "Passw0rd!",
            "full_name": "Alice",
            "role": "job_seeker",
        },
    )
    assert r.status_code == 201, r.text
    assert "user_id" in r.json()

    r2 = await client.post(
        "/api/v1/auth/login",
        json={"email": "alice@example.com", "password": "Passw0rd!"},
    )
    assert r2.status_code == 200, r2.text
    body = r2.json()
    assert body["token_type"] == "bearer"
    assert body["role"] == "job_seeker"
    assert body["access_token"] and body["refresh_token"]


@pytest.mark.asyncio
async def test_register_duplicate_conflict(client, user_factory):
    user, _ = await user_factory(email="dup@example.com")
    r = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "dup@example.com",
            "password": "Passw0rd!",
            "full_name": "Dup",
            "role": "job_seeker",
        },
    )
    assert r.status_code == 409
    assert r.json()["error"]["code"] == "CONFLICT"


@pytest.mark.asyncio
async def test_register_rejects_admin_role(client):
    r = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "hax@example.com",
            "password": "Passw0rd!",
            "full_name": "Hax",
            "role": "admin",
        },
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_register_weak_password(client):
    r = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "weak@example.com",
            "password": "onlyletters",
            "full_name": "Weak",
            "role": "job_seeker",
        },
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_login_wrong_password_generic_message(client, user_factory):
    await user_factory(email="bob@example.com")
    r = await client.post(
        "/api/v1/auth/login",
        json={"email": "bob@example.com", "password": "WrongPass1"},
    )
    assert r.status_code == 401
    assert r.json()["error"]["message"] == "Invalid email or password"


@pytest.mark.asyncio
async def test_login_unknown_email_same_message(client):
    r = await client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.com", "password": "Whatever1"},
    )
    assert r.status_code == 401
    assert r.json()["error"]["message"] == "Invalid email or password"


@pytest.mark.asyncio
async def test_login_inactive_forbidden(client, user_factory):
    await user_factory(email="inactive@example.com", is_active=False)
    r = await client.post(
        "/api/v1/auth/login",
        json={"email": "inactive@example.com", "password": "Passw0rd!"},
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_refresh_rotation_and_reuse_detection(client, user_factory):
    await user_factory(email="rot@example.com")
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "rot@example.com", "password": "Passw0rd!"},
    )
    assert login.status_code == 200
    refresh1 = login.json()["refresh_token"]

    r1 = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh1})
    assert r1.status_code == 200, r1.text
    refresh2 = r1.json()["refresh_token"]
    assert refresh2 != refresh1

    # Reuse of the original refresh token must fail and invalidate all tokens
    r2 = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh1})
    assert r2.status_code == 401

    # The rotated token is now revoked too
    r3 = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh2})
    assert r3.status_code == 401


@pytest.mark.asyncio
async def test_logout_revokes_refresh(client, user_factory):
    await user_factory(email="out@example.com")
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "out@example.com", "password": "Passw0rd!"},
    )
    refresh = login.json()["refresh_token"]
    out = await client.post("/api/v1/auth/logout", json={"refresh_token": refresh})
    assert out.status_code == 204
    r = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh})
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_me_endpoint(client, user_factory):
    user, pw = await user_factory(email="me@example.com")
    login = await client.post(
        "/api/v1/auth/login", json={"email": "me@example.com", "password": pw}
    )
    token = login.json()["access_token"]
    r = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    body = r.json()
    assert body["user_id"] == str(user.id)
    assert body["role"] == "job_seeker"


@pytest.mark.asyncio
async def test_token_endpoint_form(client, user_factory):
    await user_factory(email="form@example.com")
    r = await client.post(
        "/api/v1/auth/token",
        data={"username": "form@example.com", "password": "Passw0rd!"},
    )
    assert r.status_code == 200
    assert r.json()["access_token"]


@pytest.mark.asyncio
async def test_oauth_not_configured(client):
    r = await client.get("/api/v1/auth/oauth/google")
    assert r.status_code == 501
    assert r.json()["error"]["code"] == "OAUTH_NOT_CONFIGURED"