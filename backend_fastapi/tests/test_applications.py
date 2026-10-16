"""Application tracking tests: transitions, history, board."""
from __future__ import annotations

import uuid

import pytest

from app.models.enums import CompanyType, UserRole


@pytest.fixture
async def setup_app(db_session, user_factory):
    from app.models.company import Company
    from app.models.job import Job
    from app.utils.slugify import slugify

    seeker, _ = await user_factory(email="app-seeker@example.com", role=UserRole.job_seeker)
    recruiter, _ = await user_factory(email="app-rec@example.com", role=UserRole.recruiter)
    company = Company(
        name=f"AppCo-{uuid.uuid4().hex[:6]}",
        slug=slugify(f"appco-{uuid.uuid4().hex[:6]}"),
        company_type=CompanyType.startup.value,
        owner_user_id=recruiter.id,
    )
    db_session.add(company)
    await db_session.commit()

    job = Job(
        company_id=company.id,
        posted_by_id=recruiter.id,
        title="Apply target",
        description="...",
        job_type="full_time",
        work_mode="remote",
        is_remote=True,
        experience_level="mid",
        skills=["python"],
        required_skills=["python"],
        keywords=[],
        tags=[],
        is_fresher_friendly=False,
        is_active=True,
        applicant_count=0,
        competition_level="low",
    )
    db_session.add(job)
    await db_session.commit()
    return seeker, recruiter, job


@pytest.mark.asyncio
async def test_apply_and_transition_matrix(client, user_factory, auth_headers, setup_app):
    seeker, recruiter, job = setup_app
    seeker_headers = await auth_headers["login"]("app-seeker@example.com", "Passw0rd!")
    recruiter_headers = await auth_headers["login"]("app-rec@example.com", "Passw0rd!")

    # Apply
    r = await client.post(
        "/api/v1/applications",
        headers=seeker_headers,
        json={"job_id": str(job.id)},
    )
    assert r.status_code == 201, r.text
    app_id = r.json()["id"]
    assert r.json()["status"] == "applied"

    # Applied → shortlisted
    r2 = await client.patch(
        f"/api/v1/applications/{app_id}/status",
        headers=recruiter_headers,
        json={"status": "shortlisted"},
    )
    assert r2.status_code == 200
    assert r2.json()["status"] == "shortlisted"

    # Shortlisted → interview
    r3 = await client.patch(
        f"/api/v1/applications/{app_id}/status",
        headers=recruiter_headers,
        json={"status": "interview"},
    )
    assert r3.status_code == 200

    # Interview → rejected
    r4 = await client.patch(
        f"/api/v1/applications/{app_id}/status",
        headers=recruiter_headers,
        json={"status": "rejected"},
    )
    assert r4.status_code == 200

    # Rejected → anything is invalid
    r5 = await client.patch(
        f"/api/v1/applications/{app_id}/status",
        headers=recruiter_headers,
        json={"status": "shortlisted"},
    )
    assert r5.status_code == 409
    assert r5.json()["error"]["code"] == "INVALID_STATUS_TRANSITION"


@pytest.mark.asyncio
async def test_invalid_transition_from_applied_to_interview(client, user_factory, auth_headers, setup_app):
    seeker, recruiter, job = setup_app
    seeker_headers = await auth_headers["login"]("app-seeker@example.com", "Passw0rd!")
    recruiter_headers = await auth_headers["login"]("app-rec@example.com", "Passw0rd!")
    r = await client.post(
        "/api/v1/applications", headers=seeker_headers, json={"job_id": str(job.id)}
    )
    app_id = r.json()["id"]
    bad = await client.patch(
        f"/api/v1/applications/{app_id}/status",
        headers=recruiter_headers,
        json={"status": "interview"},
    )
    assert bad.status_code == 409


@pytest.mark.asyncio
async def test_history_records_every_transition(client, user_factory, auth_headers, setup_app):
    seeker, recruiter, job = setup_app
    sh = await auth_headers["login"]("app-seeker@example.com", "Passw0rd!")
    rh = await auth_headers["login"]("app-rec@example.com", "Passw0rd!")
    created = await client.post(
        "/api/v1/applications", headers=sh, json={"job_id": str(job.id)}
    )
    app_id = created.json()["id"]
    await client.patch(
        f"/api/v1/applications/{app_id}/status", headers=rh, json={"status": "shortlisted"}
    )
    await client.patch(
        f"/api/v1/applications/{app_id}/status", headers=rh, json={"status": "rejected"}
    )
    h = await client.get(f"/api/v1/applications/{app_id}/history", headers=sh)
    assert h.status_code == 200
    events = h.json()
    to_states = [e["to_status"] for e in events]
    assert to_states == ["applied", "shortlisted", "rejected"]


@pytest.mark.asyncio
async def test_board_groups_by_status(client, user_factory, auth_headers, setup_app):
    seeker, recruiter, job = setup_app
    sh = await auth_headers["login"]("app-seeker@example.com", "Passw0rd!")
    created = await client.post(
        "/api/v1/applications", headers=sh, json={"job_id": str(job.id)}
    )
    assert created.status_code == 201
    b = await client.get("/api/v1/applications/board", headers=sh)
    assert b.status_code == 200
    body = b.json()
    statuses = {c["status"]: c["count"] for c in body["columns"]}
    assert statuses.get("applied", 0) == 1


@pytest.mark.asyncio
async def test_recruiter_cannot_mutate_other_job_status(
    client, user_factory, auth_headers, setup_app
):
    _, _, job = setup_app
    other_recruiter, _ = await user_factory(
        email="other-rec@example.com", role=UserRole.recruiter
    )
    sh = await auth_headers["login"]("app-seeker@example.com", "Passw0rd!")
    oh = await auth_headers["login"]("other-rec@example.com", "Passw0rd!")
    created = await client.post(
        "/api/v1/applications", headers=sh, json={"job_id": str(job.id)}
    )
    app_id = created.json()["id"]
    r = await client.patch(
        f"/api/v1/applications/{app_id}/status",
        headers=oh,
        json={"status": "shortlisted"},
    )
    assert r.status_code == 403