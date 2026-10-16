"""Swipe behavior tests: idempotency, counters, undo."""
from __future__ import annotations

import uuid

import pytest
from sqlalchemy import func, select

from app.models.enums import CompanyType, UserRole
from app.models.swipe import Application, SavedJob, Swipe


@pytest.fixture
async def setup_job(db_session, user_factory):
    from app.models.company import Company
    from app.models.job import Job
    from app.utils.slugify import slugify

    recruiter, _ = await user_factory(email=f"rec-{uuid.uuid4().hex[:6]}@example.com", role=UserRole.recruiter)
    company = Company(
        name=f"Co-{uuid.uuid4().hex[:6]}",
        slug=slugify(f"Co-{uuid.uuid4().hex[:6]}"),
        company_type=CompanyType.startup.value,
        owner_user_id=recruiter.id,
    )
    db_session.add(company)
    await db_session.commit()

    job = Job(
        company_id=company.id,
        posted_by_id=recruiter.id,
        title="Test Job",
        description="Desc",
        job_type="full_time",
        work_mode="onsite",
        experience_level="mid",
        skills=[],
        required_skills=[],
        keywords=[],
        tags=[],
        is_remote=False,
        is_fresher_friendly=False,
        is_active=True,
        applicant_count=0,
        competition_level="low",
    )
    db_session.add(job)
    await db_session.commit()
    return job, company


@pytest.mark.asyncio
async def test_swipe_right_apply_creates_application(client, user_factory, auth_headers, setup_job):
    job, _ = setup_job
    await user_factory(email="sw1@example.com", role=UserRole.job_seeker)
    headers = await auth_headers["login"]("sw1@example.com", "Passw0rd!")

    r = await client.post(
        "/api/v1/swipes",
        headers=headers,
        json={"job_id": str(job.id), "direction": "right", "action": "apply"},
    )
    assert r.status_code == 201, r.text
    assert r.json()["action"] == "apply"

    # Application exists with status applied
    r2 = await client.get("/api/v1/swipes/history", headers=headers)
    assert r2.json()["total"] == 1


@pytest.mark.asyncio
async def test_rapid_double_swipe_is_idempotent(client, user_factory, auth_headers, setup_job, db_session):
    """Two rapid right+apply swipes must not double-count the applicant."""
    job, _ = setup_job
    await user_factory(email="sw2@example.com", role=UserRole.job_seeker)
    headers = await auth_headers["login"]("sw2@example.com", "Passw0rd!")

    r1 = await client.post(
        "/api/v1/swipes",
        headers=headers,
        json={"job_id": str(job.id), "direction": "right", "action": "apply"},
    )
    r2 = await client.post(
        "/api/v1/swipes",
        headers=headers,
        json={"job_id": str(job.id), "direction": "right", "action": "apply"},
    )
    assert r1.status_code == 201
    assert r2.status_code == 201

    # Exactly one swipe row for (user, job)
    swipes = (await db_session.execute(select(Swipe).where(Swipe.job_id == job.id))).scalars().all()
    assert len(swipes) == 1

    apps = (
        await db_session.execute(select(Application).where(Application.job_id == job.id))
    ).scalars().all()
    assert len(apps) == 1

    # Applicant count is exactly 1
    from app.models.job import Job
    count = (
        await db_session.execute(select(Job.applicant_count).where(Job.id == job.id))
    ).scalar_one()
    assert count == 1


@pytest.mark.asyncio
async def test_swipe_left_no_side_effects(client, user_factory, auth_headers, setup_job, db_session):
    job, _ = setup_job
    await user_factory(email="sw3@example.com", role=UserRole.job_seeker)
    headers = await auth_headers["login"]("sw3@example.com", "Passw0rd!")

    r = await client.post(
        "/api/v1/swipes",
        headers=headers,
        json={"job_id": str(job.id), "direction": "left"},
    )
    assert r.status_code == 201
    assert r.json()["action"] == "skip"

    apps = (
        await db_session.execute(select(func.count()).select_from(Application))
    ).scalar_one()
    assert apps == 0


@pytest.mark.asyncio
async def test_swipe_right_save_creates_saved_and_application(client, user_factory, auth_headers, setup_job, db_session):
    job, _ = setup_job
    await user_factory(email="sw4@example.com", role=UserRole.job_seeker)
    headers = await auth_headers["login"]("sw4@example.com", "Passw0rd!")

    r = await client.post(
        "/api/v1/swipes",
        headers=headers,
        json={"job_id": str(job.id), "direction": "right", "action": "save"},
    )
    assert r.status_code == 201
    assert r.json()["action"] == "save"

    saved = (
        await db_session.execute(select(SavedJob).where(SavedJob.job_id == job.id))
    ).scalars().all()
    assert len(saved) == 1

    apps = (
        await db_session.execute(select(Application).where(Application.job_id == job.id))
    ).scalars().all()
    assert len(apps) == 1
    assert apps[0].status == "saved"


@pytest.mark.asyncio
async def test_undo_last_swipe_reverses_apply(client, user_factory, auth_headers, setup_job, db_session):
    job, _ = setup_job
    await user_factory(email="sw5@example.com", role=UserRole.job_seeker)
    headers = await auth_headers["login"]("sw5@example.com", "Passw0rd!")

    await client.post(
        "/api/v1/swipes",
        headers=headers,
        json={"job_id": str(job.id), "direction": "right", "action": "apply"},
    )
    r = await client.delete("/api/v1/swipes/last", headers=headers)
    assert r.status_code == 200
    assert r.json()["undone"] is True

    apps = (
        await db_session.execute(select(Application).where(Application.job_id == job.id))
    ).scalars().all()
    assert len(apps) == 0

    from app.models.job import Job
    count = (
        await db_session.execute(select(Job.applicant_count).where(Job.id == job.id))
    ).scalar_one()
    assert count == 0


@pytest.mark.asyncio
async def test_undo_on_empty_history(client, user_factory, auth_headers):
    await user_factory(email="sw6@example.com", role=UserRole.job_seeker)
    headers = await auth_headers["login"]("sw6@example.com", "Passw0rd!")
    r = await client.delete("/api/v1/swipes/last", headers=headers)
    assert r.status_code == 200
    assert r.json() == {"undone": False}


@pytest.mark.asyncio
async def test_recruiter_cannot_swipe(client, user_factory, auth_headers, setup_job):
    job, _ = setup_job
    await user_factory(email="recx@example.com", role=UserRole.recruiter)
    headers = await auth_headers["login"]("recx@example.com", "Passw0rd!")
    r = await client.post(
        "/api/v1/swipes",
        headers=headers,
        json={"job_id": str(job.id), "direction": "right"},
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_swipe_unknown_job_404(client, user_factory, auth_headers):
    await user_factory(email="sw7@example.com", role=UserRole.job_seeker)
    headers = await auth_headers["login"]("sw7@example.com", "Passw0rd!")
    r = await client.post(
        "/api/v1/swipes",
        headers=headers,
        json={"job_id": str(uuid.uuid4()), "direction": "right"},
    )
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_saved_jobs_listed(client, user_factory, auth_headers, setup_job):
    job, _ = setup_job
    await user_factory(email="sw8@example.com", role=UserRole.job_seeker)
    headers = await auth_headers["login"]("sw8@example.com", "Passw0rd!")
    await client.post(
        "/api/v1/swipes",
        headers=headers,
        json={"job_id": str(job.id), "direction": "right", "action": "save"},
    )
    r = await client.get("/api/v1/saved-jobs", headers=headers)
    assert r.status_code == 200
    assert r.json()["total"] == 1
    assert r.json()["items"][0]["job_id"] == str(job.id)