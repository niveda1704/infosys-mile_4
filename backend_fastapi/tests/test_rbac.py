"""RBAC and ownership tests."""
from __future__ import annotations

import pytest

from app.models.enums import UserRole


@pytest.mark.asyncio
async def test_unauthenticated_me_unauthorized(client):
    r = await client.get("/api/v1/auth/me")
    assert r.status_code == 401
    assert r.headers.get("www-authenticate", "").lower() == "bearer"


@pytest.mark.asyncio
async def test_job_seeker_can_access_profile(client, user_factory, auth_headers):
    await user_factory(email="js@example.com", role=UserRole.job_seeker)
    headers = await auth_headers["login"]("js@example.com", "Passw0rd!")
    r = await client.get("/api/v1/users/me/profile", headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert "skills" in body


@pytest.mark.asyncio
async def test_recruiter_forbidden_on_profile(client, user_factory, auth_headers):
    await user_factory(email="rec@example.com", role=UserRole.recruiter)
    headers = await auth_headers["login"]("rec@example.com", "Passw0rd!")
    r = await client.get("/api/v1/users/me/profile", headers=headers)
    assert r.status_code == 403
    body = r.json()
    assert body["error"]["code"] == "FORBIDDEN"
    assert "job_seeker" in body["error"]["message"]


@pytest.mark.asyncio
async def test_admin_forbidden_on_profile(client, user_factory, auth_headers):
    await user_factory(email="adm@example.com", role=UserRole.admin)
    headers = await auth_headers["login"]("adm@example.com", "Passw0rd!")
    r = await client.get("/api/v1/users/me/profile", headers=headers)
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_user_cannot_update_another_user_via_me(client, user_factory, auth_headers):
    a, _ = await user_factory(email="a@example.com")
    b, _ = await user_factory(email="b@example.com")
    headers = await auth_headers["login"]("a@example.com", "Passw0rd!")
    # PATCH /users/me only affects A
    r = await client.patch("/api/v1/users/me", headers=headers, json={"full_name": "A renamed"})
    assert r.status_code == 200
    assert r.json()["full_name"] == "A renamed"
    # B unchanged
    r2 = await client.get("/api/v1/auth/me", headers=await auth_headers["login"]("b@example.com", "Passw0rd!"))
    assert r2.json()["name"] == "Test User"