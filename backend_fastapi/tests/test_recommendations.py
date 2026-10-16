"""Recommendation pipeline tests."""
from __future__ import annotations

import uuid

import pytest

from app.integrations.ai.factory import get_ai_adapter
from app.models.enums import CompanyType, UserRole


@pytest.fixture(autouse=True)
def _clear_ai_cache():
    get_ai_adapter.cache_clear()
    yield
    get_ai_adapter.cache_clear()


@pytest.fixture
async def seed_jobs(db_session, user_factory):
    """Create 5 jobs across a couple of companies, plus a job seeker."""
    from app.models.company import Company
    from app.models.job import Job
    from app.utils.slugify import slugify

    recruiter, _ = await user_factory(
        email=f"recr-{uuid.uuid4().hex[:6]}@example.com", role=UserRole.recruiter
    )
    companies = []
    for i in range(2):
        c = Company(
            name=f"Rec Co {i}-{uuid.uuid4().hex[:6]}",
            slug=slugify(f"rec-co-{i}-{uuid.uuid4().hex[:6]}"),
            company_type=CompanyType.startup.value,
            is_newly_founded=(i == 0),
            owner_user_id=recruiter.id,
        )
        db_session.add(c)
        companies.append(c)
    await db_session.commit()

    jobs = []
    for i, skill in enumerate(["python", "fastapi", "postgresql", "react", "docker"]):
        j = Job(
            company_id=companies[i % 2].id,
            posted_by_id=recruiter.id,
            title=f"Engineer {i}",
            description=f"Work with {skill} and other tools.",
            job_type="full_time",
            work_mode="remote" if i % 2 == 0 else "onsite",
            is_remote=(i % 2 == 0),
            location="Remote" if i % 2 == 0 else "Bangalore",
            experience_level="mid",
            skills=[skill],
            required_skills=[skill],
            keywords=[skill, "api"],
            tags=[],
            is_fresher_friendly=False,
            is_active=True,
            applicant_count=i * 5,  # vary competition a bit
            competition_level="low" if i * 5 <= 20 else "medium",
        )
        db_session.add(j)
        jobs.append(j)
    await db_session.commit()
    return jobs, companies


@pytest.mark.asyncio
async def test_recommendations_returns_ranked_jobs(
    client, user_factory, auth_headers, seed_jobs
):
    jobs, _ = seed_jobs
    await user_factory(email="rcm1@example.com", role=UserRole.job_seeker)
    headers = await auth_headers["login"]("rcm1@example.com", "Passw0rd!")

    r = await client.get("/api/v1/recommendations?limit=10", headers=headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert isinstance(body, list)
    assert len(body) <= 10
    for item in body:
        assert "match_percentage" in item
        assert "reason_tags" in item
        assert item["job"]["id"] == item["job_id"]
    # At least one job should have a positive score
    assert any(it["match_percentage"] > 0 for it in body)


@pytest.mark.asyncio
async def test_already_swiped_jobs_are_excluded(
    client, user_factory, auth_headers, seed_jobs
):
    jobs, _ = seed_jobs
    await user_factory(email="rcm2@example.com", role=UserRole.job_seeker)
    headers = await auth_headers["login"]("rcm2@example.com", "Passw0rd!")

    # Swipe (skip) the first job
    swiped = jobs[0]
    await client.post(
        "/api/v1/swipes",
        headers=headers,
        json={"job_id": str(swiped.id), "direction": "left"},
    )

    r = await client.get("/api/v1/recommendations?limit=10", headers=headers)
    assert r.status_code == 200
    returned_ids = {it["job_id"] for it in r.json()}
    assert str(swiped.id) not in returned_ids


@pytest.mark.asyncio
async def test_recruiter_forbidden(client, user_factory, auth_headers, seed_jobs):
    await user_factory(email="rcmrec@example.com", role=UserRole.recruiter)
    headers = await auth_headers["login"]("rcmrec@example.com", "Passw0rd!")
    r = await client.get("/api/v1/recommendations", headers=headers)
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_target_another_user(
    client, user_factory, auth_headers, seed_jobs
):
    jobs, _ = seed_jobs
    target_user, _ = await user_factory(
        email="target-rcm@example.com", role=UserRole.job_seeker
    )
    await user_factory(email="admin-rcm@example.com", role=UserRole.admin)
    headers = await auth_headers["login"]("admin-rcm@example.com", "Passw0rd!")

    r = await client.get(
        f"/api/v1/recommendations?user_id={target_user.id}&limit=5", headers=headers
    )
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.asyncio
async def test_job_seeker_cannot_pass_user_id(
    client, user_factory, auth_headers, seed_jobs
):
    target, _ = await user_factory(email="other-rcm@example.com", role=UserRole.job_seeker)
    await user_factory(email="rcm3@example.com", role=UserRole.job_seeker)
    headers = await auth_headers["login"]("rcm3@example.com", "Passw0rd!")
    r = await client.get(
        f"/api/v1/recommendations?user_id={target.id}", headers=headers
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_recommendations_fall_back_when_remote_fails(
    client, user_factory, auth_headers, seed_jobs, monkeypatch
):
    from app.core.config import settings
    from app.integrations.ai.remote_adapter import RemoteHttpAdapter

    monkeypatch.setattr(settings, "AI_MODE", "remote")
    monkeypatch.setattr(settings, "AI_SERVICE_BASE_URL", "http://127.0.0.1:9")
    monkeypatch.setattr(settings, "AI_SERVICE_TIMEOUT_SECONDS", 1)
    get_ai_adapter.cache_clear()
    assert isinstance(get_ai_adapter(), RemoteHttpAdapter)

    await user_factory(email="rcm4@example.com", role=UserRole.job_seeker)
    headers = await auth_headers["login"]("rcm4@example.com", "Passw0rd!")
    r = await client.get("/api/v1/recommendations?limit=5", headers=headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.asyncio
async def test_reason_tags_populated(
    client, user_factory, auth_headers, seed_jobs, db_session
):
    """Users whose profile mentions 'python' should see 'Matches your skills' on at least
    one recommendation."""
    from app.repositories.user_repo import UserRepository

    user, _ = await user_factory(email="rcm5@example.com", role=UserRole.job_seeker)
    # Give them a profile with a matching skill
    repo = UserRepository(db_session)
    profile = await repo.ensure_profile(user.id)
    profile.skills = ["python"]
    profile.open_to_remote = True
    await db_session.commit()

    headers = await auth_headers["login"]("rcm5@example.com", "Passw0rd!")
    r = await client.get("/api/v1/recommendations?limit=10", headers=headers)
    assert r.status_code == 200
    tags_flat = {t for item in r.json() for t in item["reason_tags"]}
    assert "Matches your skills" in tags_flat