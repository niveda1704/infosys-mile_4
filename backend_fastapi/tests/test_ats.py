"""ATS scoring and suggestion tests, including forced remote failure."""
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
async def setup_pair(db_session, user_factory, make_docx_bytes):
    """Create a job seeker with a parsed resume and a job with required skills."""
    from app.models.company import Company
    from app.models.job import Job
    from app.utils.slugify import slugify

    seeker, _ = await user_factory(email="seeker-ats@example.com", role=UserRole.job_seeker)
    recruiter, _ = await user_factory(email="rec-ats@example.com", role=UserRole.recruiter)
    company = Company(
        name=f"ATS Co-{uuid.uuid4().hex[:6]}",
        slug=slugify(f"ats-co-{uuid.uuid4().hex[:6]}"),
        company_type=CompanyType.startup.value,
        owner_user_id=recruiter.id,
    )
    db_session.add(company)
    await db_session.commit()

    job = Job(
        company_id=company.id,
        posted_by_id=recruiter.id,
        title="Backend Engineer",
        description="We need Python, FastAPI, PostgreSQL, Docker experience.",
        job_type="full_time",
        work_mode="remote",
        is_remote=True,
        experience_level="mid",
        skills=["python", "fastapi", "postgresql", "docker"],
        required_skills=["python", "fastapi", "postgresql"],
        keywords=["microservices", "docker", "rest"],
        tags=[],
        is_fresher_friendly=False,
        is_active=True,
        applicant_count=0,
        competition_level="low",
    )
    db_session.add(job)
    await db_session.commit()
    return seeker, recruiter, job, make_docx_bytes


@pytest.mark.asyncio
async def test_ats_score_creates_missing_items_when_below_80(
    client, auth_headers, setup_pair
):
    seeker, _, job, make_docx = setup_pair
    headers = await auth_headers["login"]("seeker-ats@example.com", "Passw0rd!")

    # Upload a resume with only Python (missing fastapi/postgresql)
    up = await client.post(
        "/api/v1/resumes/upload",
        headers=headers,
        files={
            "file": (
                "cv.docx",
                make_docx("Skills: Python only."),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )
    assert up.status_code == 201
    resume_id = up.json()["resume_id"]

    # Parse first so the ATS service reuses it
    parse = await client.post(f"/api/v1/resumes/{resume_id}/parse", headers=headers)
    assert parse.status_code == 200

    r = await client.post(
        "/api/v1/ats/score",
        headers=headers,
        json={"resume_id": resume_id, "job_id": str(job.id)},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["match_score"] < 80.0
    assert body["below_threshold"] is True
    # Missing items MUST be populated when below 80
    assert body["missing_skills"]
    assert "fastapi" in [s.lower() for s in body["missing_skills"]]
    assert body["missing_keywords"]


@pytest.mark.asyncio
async def test_ats_score_upsert_recomputes(client, auth_headers, setup_pair):
    seeker, _, job, make_docx = setup_pair
    headers = await auth_headers["login"]("seeker-ats@example.com", "Passw0rd!")

    up = await client.post(
        "/api/v1/resumes/upload",
        headers=headers,
        files={
            "file": (
                "cv.docx",
                make_docx("Python FastAPI PostgreSQL Docker"),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )
    resume_id = up.json()["resume_id"]
    await client.post(f"/api/v1/resumes/{resume_id}/parse", headers=headers)

    r1 = await client.post(
        "/api/v1/ats/score",
        headers=headers,
        json={"resume_id": resume_id, "job_id": str(job.id)},
    )
    r2 = await client.post(
        "/api/v1/ats/score",
        headers=headers,
        json={"resume_id": resume_id, "job_id": str(job.id)},
    )
    assert r1.status_code == 200 and r2.status_code == 200

    # Same version + job = same ats_scores row (upsert, no duplicates)
    listing = await client.get("/api/v1/ats/scores", headers=headers)
    assert listing.status_code == 200
    rows = listing.json()
    matching = [row for row in rows if row["job_id"] == str(job.id)]
    assert len(matching) == 1


@pytest.mark.asyncio
async def test_ats_suggestions_returns_rule_based(
    client, auth_headers, setup_pair
):
    seeker, _, job, make_docx = setup_pair
    headers = await auth_headers["login"]("seeker-ats@example.com", "Passw0rd!")
    up = await client.post(
        "/api/v1/resumes/upload",
        headers=headers,
        files={
            "file": (
                "cv.docx",
                make_docx("Python"),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )
    resume_id = up.json()["resume_id"]
    await client.post(f"/api/v1/resumes/{resume_id}/parse", headers=headers)

    score = await client.post(
        "/api/v1/ats/score",
        headers=headers,
        json={"resume_id": resume_id, "job_id": str(job.id)},
    )
    version_id = score.json()["resume_version_id"]

    r = await client.post(
        "/api/v1/ats/suggestions",
        headers=headers,
        json={"resume_version_id": version_id, "job_id": str(job.id)},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["suggestions"]
    assert body["suggestion_source"] == "rule_based"


@pytest.mark.asyncio
async def test_ats_forces_fallback_when_remote_fails(
    client, auth_headers, setup_pair, monkeypatch
):
    """Point AI_MODE at an unreachable remote host. The service must
    transparently fall back to the local heuristic and still return a score."""
    from app.core.config import settings
    from app.integrations.ai.remote_adapter import RemoteHttpAdapter

    # Force the factory to build a RemoteHttpAdapter pointed at a dead host
    monkeypatch.setattr(settings, "AI_MODE", "remote")
    monkeypatch.setattr(settings, "AI_SERVICE_BASE_URL", "http://127.0.0.1:9")
    monkeypatch.setattr(settings, "AI_SERVICE_TIMEOUT_SECONDS", 1)
    get_ai_adapter.cache_clear()

    # Sanity: factory now returns a RemoteHttpAdapter
    adapter = get_ai_adapter()
    assert isinstance(adapter, RemoteHttpAdapter)

    seeker, _, job, make_docx = setup_pair
    headers = await auth_headers["login"]("seeker-ats@example.com", "Passw0rd!")
    up = await client.post(
        "/api/v1/resumes/upload",
        headers=headers,
        files={
            "file": (
                "cv.docx",
                make_docx("Python FastAPI"),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )
    resume_id = up.json()["resume_id"]
    await client.post(f"/api/v1/resumes/{resume_id}/parse", headers=headers)

    r = await client.post(
        "/api/v1/ats/score",
        headers=headers,
        json={"resume_id": resume_id, "job_id": str(job.id)},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    # Fallback returns the local heuristic's generated_by tag
    assert body["generated_by"] == "heuristic-v0"
    assert body["match_score"] >= 0


@pytest.mark.asyncio
async def test_recruiter_cannot_score(client, user_factory, auth_headers, setup_pair):
    _, recruiter, job, _ = setup_pair
    headers = await auth_headers["login"]("rec-ats@example.com", "Passw0rd!")
    r = await client.post(
        "/api/v1/ats/score",
        headers=headers,
        json={"resume_version_id": str(uuid.uuid4()), "job_id": str(job.id)},
    )
    assert r.status_code == 403