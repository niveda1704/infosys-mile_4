"""Analytics tests: role scoping, funnel counts, hiring trends, admin aggregate refresh."""
from __future__ import annotations

import uuid
from datetime import date, timedelta

import pytest

from app.models.enums import CompanyType, UserRole


@pytest.fixture
async def seeded(db_session, user_factory):
    """Seed a couple of companies/jobs/applications so analytics has data."""
    from app.models.company import Company
    from app.models.job import Job
    from app.models.swipe import Application
    from app.utils.slugify import slugify

    seeker, _ = await user_factory(email="an-seeker@example.com", role=UserRole.job_seeker)
    recruiter, _ = await user_factory(email="an-rec@example.com", role=UserRole.recruiter)
    admin, _ = await user_factory(email="an-admin@example.com", role=UserRole.admin)

    companies = []
    for ctype in (CompanyType.startup.value, CompanyType.mnc.value):
        c = Company(
            name=f"AnCo-{ctype}-{uuid.uuid4().hex[:6]}",
            slug=slugify(f"anco-{ctype}-{uuid.uuid4().hex[:6]}"),
            company_type=ctype,
            owner_user_id=recruiter.id,
        )
        db_session.add(c)
        companies.append(c)
    await db_session.commit()

    jobs = []
    for i, c in enumerate(companies):
        j = Job(
            company_id=c.id,
            posted_by_id=recruiter.id,
            title=f"Analytics Job {i}",
            description="x",
            job_type="full_time",
            work_mode="remote",
            is_remote=True,
            experience_level="mid",
            skills=["python", "sql"],
            required_skills=["python"],
            keywords=["api"],
            tags=[],
            is_fresher_friendly=False,
            is_active=True,
            applicant_count=0,
            competition_level="low",
        )
        db_session.add(j)
        jobs.append(j)
    await db_session.commit()

    # Applications for the seeker
    a1 = Application(
        user_id=seeker.id,
        job_id=jobs[0].id,
        status="applied",
        is_early_applicant=True,
        applied_at=None,
    )
    a2 = Application(
        user_id=seeker.id,
        job_id=jobs[1].id,
        status="shortlisted",
        is_early_applicant=False,
        applied_at=None,
    )
    db_session.add_all([a1, a2])
    await db_session.commit()
    return seeker, recruiter, admin, jobs


@pytest.mark.asyncio
async def test_job_seeker_analytics(client, auth_headers, seeded):
    seeker, _, _, _ = seeded
    headers = await auth_headers["login"]("an-seeker@example.com", "Passw0rd!")
    r = await client.get("/api/v1/analytics/job-seeker", headers=headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["application_funnel"]["applied"] == 1
    assert body["application_funnel"]["shortlisted"] == 1
    assert "swipes_by_direction" in body


@pytest.mark.asyncio
async def test_job_seeker_analytics_forbidden_for_recruiter(client, auth_headers, seeded):
    _, recruiter, _, _ = seeded
    headers = await auth_headers["login"]("an-rec@example.com", "Passw0rd!")
    r = await client.get("/api/v1/analytics/job-seeker", headers=headers)
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_recruiter_analytics(client, auth_headers, seeded):
    _, recruiter, _, jobs = seeded
    headers = await auth_headers["login"]("an-rec@example.com", "Passw0rd!")
    r = await client.get("/api/v1/analytics/recruiter", headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert body["applicants_per_job"]
    assert sum(body["status_funnel"].values()) == 2


@pytest.mark.asyncio
async def test_admin_analytics(client, auth_headers, seeded):
    _, _, admin, _ = seeded
    headers = await auth_headers["login"]("an-admin@example.com", "Passw0rd!")
    r = await client.get("/api/v1/analytics/admin", headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert body["active_jobs"] >= 2
    assert body["total_applications"] == 2


@pytest.mark.asyncio
async def test_admin_analytics_forbidden_for_seeker(client, auth_headers, seeded):
    seeker, _, _, _ = seeded
    headers = await auth_headers["login"]("an-seeker@example.com", "Passw0rd!")
    r = await client.get("/api/v1/analytics/admin", headers=headers)
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_hiring_trends_default_window(client, auth_headers, seeded):
    seeker, _, _, _ = seeded
    headers = await auth_headers["login"]("an-seeker@example.com", "Passw0rd!")
    r = await client.get("/api/v1/analytics/hiring-trends", headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert body["granularity"] == "day"
    assert "jobs_over_time" in body
    assert "top_skills" in body


@pytest.mark.asyncio
async def test_hiring_trends_rejects_bad_range(client, auth_headers, seeded):
    seeker, _, _, _ = seeded
    headers = await auth_headers["login"]("an-seeker@example.com", "Passw0rd!")
    today = date.today()
    r = await client.get(
        "/api/v1/analytics/hiring-trends",
        headers=headers,
        params={"from": today.isoformat(), "to": (today - timedelta(days=10)).isoformat()},
    )
    assert r.status_code == 400

    r2 = await client.get(
        "/api/v1/analytics/hiring-trends",
        headers=headers,
        params={
            "from": (today - timedelta(days=400)).isoformat(),
            "to": today.isoformat(),
        },
    )
    assert r2.status_code == 400


@pytest.mark.asyncio
async def test_admin_refresh_aggregates(client, auth_headers, seeded):
    _, _, _, _ = seeded
    headers = await auth_headers["login"]("an-admin@example.com", "Passw0rd!")
    r = await client.post("/api/v1/admin/analytics/refresh", headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert "daily_job_stats_rows" in body
    assert "skill_demand_rows" in body


@pytest.mark.asyncio
async def test_admin_refresh_requires_admin(client, auth_headers, seeded):
    seeker, _, _, _ = seeded
    headers = await auth_headers["login"]("an-seeker@example.com", "Passw0rd!")
    r = await client.post("/api/v1/admin/analytics/refresh", headers=headers)
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_admin_recompute_competition(client, auth_headers, seeded):
    _, _, _, _ = seeded
    headers = await auth_headers["login"]("an-admin@example.com", "Passw0rd!")
    r = await client.post("/api/v1/admin/jobs/recompute-competition", headers=headers)
    assert r.status_code == 200
    assert "updated" in r.json()


@pytest.mark.asyncio
async def test_admin_cannot_deactivate_self(client, auth_headers, seeded):
    _, _, admin, _ = seeded
    headers = await auth_headers["login"]("an-admin@example.com", "Passw0rd!")
    r = await client.patch(
        f"/api/v1/admin/users/{admin.id}",
        headers=headers,
        json={"is_active": False},
    )
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_admin_can_deactivate_other(client, auth_headers, seeded):
    seeker, _, _, _ = seeded
    headers = await auth_headers["login"]("an-admin@example.com", "Passw0rd!")
    r = await client.patch(
        f"/api/v1/admin/users/{seeker.id}",
        headers=headers,
        json={"is_active": False},
    )
    assert r.status_code == 200
    assert r.json()["is_active"] is False