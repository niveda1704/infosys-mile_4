"""Job and company tests."""
from __future__ import annotations


import pytest

from app.models.enums import CompanyType, UserRole


@pytest.fixture
async def recruiter_with_company(user_factory, db_session):
    from app.models.company import Company
    from app.utils.slugify import slugify

    user, pw = await user_factory(email="rec@example.com", role=UserRole.recruiter)
    company = Company(
        name="Acme Inc",
        slug=slugify("Acme Inc"),
        company_type=CompanyType.startup.value,
        owner_user_id=user.id,
    )
    db_session.add(company)
    await db_session.commit()
    await db_session.refresh(company)
    return user, pw, company


@pytest.mark.asyncio
async def test_list_companies_empty(client):
    r = await client.get("/api/v1/companies")
    assert r.status_code == 200
    body = r.json()
    assert body["items"] == []
    assert body["total"] == 0


@pytest.mark.asyncio
async def test_create_company_requires_recruiter_or_admin(client, user_factory, auth_headers):
    await user_factory(email="js@example.com", role=UserRole.job_seeker)
    headers = await auth_headers["login"]("js@example.com", "Passw0rd!")
    r = await client.post(
        "/api/v1/companies",
        headers=headers,
        json={"name": "JS Co", "company_type": "startup"},
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_create_and_get_company(client, user_factory, auth_headers):
    await user_factory(email="rec2@example.com", role=UserRole.recruiter)
    headers = await auth_headers["login"]("rec2@example.com", "Passw0rd!")
    r = await client.post(
        "/api/v1/companies",
        headers=headers,
        json={
            "name": "Bright Labs",
            "about": "AI for good",
            "company_type": "startup",
            "is_newly_founded": True,
            "industry": "AI",
        },
    )
    assert r.status_code == 201, r.text
    cid = r.json()["id"]

    r2 = await client.get(f"/api/v1/companies/{cid}")
    assert r2.status_code == 200
    assert r2.json()["name"] == "Bright Labs"


@pytest.mark.asyncio
async def test_duplicate_company_name_conflict(client, user_factory, auth_headers):
    await user_factory(email="rec3@example.com", role=UserRole.recruiter)
    headers = await auth_headers["login"]("rec3@example.com", "Passw0rd!")
    payload = {"name": "Dup Co", "company_type": "mnc"}
    r1 = await client.post("/api/v1/companies", headers=headers, json=payload)
    assert r1.status_code == 201
    r2 = await client.post("/api/v1/companies", headers=headers, json=payload)
    assert r2.status_code == 409


@pytest.mark.asyncio
async def test_create_job_and_search(client, user_factory, auth_headers, recruiter_with_company):
    user, pw, company = recruiter_with_company
    headers = await auth_headers["login"]("rec@example.com", pw)

    r = await client.post(
        "/api/v1/jobs",
        headers=headers,
        json={
            "company_id": str(company.id),
            "title": "Backend Engineer",
            "description": "Build APIs",
            "job_type": "full_time",
            "work_mode": "remote",
            "location": "Remote",
            "salary_min": 800000,
            "salary_max": 1200000,
            "experience_level": "mid",
            "min_experience_years": 2,
            "skills": ["python", "fastapi"],
            "required_skills": ["python", "postgresql"],
            "keywords": ["api", "backend"],
        },
    )
    assert r.status_code == 201, r.text
    jid = r.json()["id"]
    assert r.json()["is_remote"] is True

    # search by skills ANY
    r2 = await client.get("/api/v1/jobs/search", params={"skills": "python"})
    assert r2.status_code == 200
    assert r2.json()["total"] >= 1

    # search by q
    r3 = await client.get("/api/v1/jobs/search", params={"q": "Backend"})
    assert r3.status_code == 200
    assert any(item["id"] == jid for item in r3.json()["items"])

    # detail
    r4 = await client.get(f"/api/v1/jobs/{jid}")
    assert r4.status_code == 200
    assert r4.json()["title"] == "Backend Engineer"

    # competition
    r5 = await client.get(f"/api/v1/jobs/{jid}/competition")
    assert r5.status_code == 200
    assert r5.json()["competition_level"] == "low"


@pytest.mark.asyncio
async def test_search_route_not_shadowed(client, user_factory, auth_headers, recruiter_with_company):
    """The /search route must be reached (not interpreted as /{job_id})."""
    user, pw, company = recruiter_with_company
    headers = await auth_headers["login"]("rec@example.com", pw)
    await client.post(
        "/api/v1/jobs",
        headers=headers,
        json={
            "company_id": str(company.id),
            "title": "T",
            "description": "D",
            "skills": ["rust"],
        },
    )
    r = await client.get("/api/v1/jobs/search")
    assert r.status_code == 200
    assert "items" in r.json()


@pytest.mark.asyncio
async def test_recruiter_cannot_update_others_job(client, user_factory, auth_headers, recruiter_with_company, db_session):
    from app.models.company import Company
    from app.models.enums import CompanyType
    from app.models.job import Job
    from app.utils.slugify import slugify

    user_a, pw, company = recruiter_with_company
    user_b, _ = await user_factory(email="other@example.com", role=UserRole.recruiter)

    job = Job(
        company_id=company.id,
        posted_by_id=user_a.id,
        title="Owned by A",
        description="...",
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

    headers_b = await auth_headers["login"]("other@example.com", "Passw0rd!")
    r = await client.patch(
        f"/api/v1/jobs/{job.id}", headers=headers_b, json={"title": "hacked"}
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_job_salary_validation(client, user_factory, auth_headers, recruiter_with_company):
    user, pw, company = recruiter_with_company
    headers = await auth_headers["login"]("rec@example.com", pw)
    r = await client.post(
        "/api/v1/jobs",
        headers=headers,
        json={
            "company_id": str(company.id),
            "title": "Bad salary",
            "description": "x",
            "salary_min": 100,
            "salary_max": 50,
        },
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_filters_low_competition_and_recently_posted(client, user_factory, auth_headers, recruiter_with_company):
    user, pw, company = recruiter_with_company
    headers = await auth_headers["login"]("rec@example.com", pw)
    await client.post(
        "/api/v1/jobs",
        headers=headers,
        json={
            "company_id": str(company.id),
            "title": "Fresh Low",
            "description": "x",
            "skills": ["python"],
        },
    )
    r = await client.get(
        "/api/v1/jobs/search",
        params={"low_competition": "true", "recently_posted": "true"},
    )
    assert r.status_code == 200
    assert r.json()["total"] >= 1