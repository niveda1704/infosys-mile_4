"""Regression tests for bugs found in the read-only audit and fixed afterwards."""
from __future__ import annotations

import uuid

import pytest
from pydantic import ValidationError
from sqlalchemy import select

from app.core.config import _DEFAULT_SECRET, Settings
from app.models.company import Company
from app.models.enums import CompanyType, UserRole
from app.models.job import Job
from app.models.swipe import Application, SavedJob
from app.services.resume_service import sanitize_filename
from app.utils.slugify import slugify


# --------------------------------------------------------------------------- pure unit tests
@pytest.mark.parametrize(
    "raw,expected",
    [
        ("a/b/../../etc/passwd", "passwd"),
        ('my "cv".pdf', "my cv.pdf"),
        ("evil\r\nX-Injected: 1.pdf", "evilX-Injected: 1.pdf"),
        ("", "resume"),
    ],
)
def test_sanitize_filename_is_header_safe(raw, expected):
    out = sanitize_filename(raw)
    assert out == expected
    assert "\r" not in out and "\n" not in out and '"' not in out


def test_production_rejects_default_or_short_secret():
    with pytest.raises(ValidationError):
        Settings(_env_file=None, ENVIRONMENT="production", SECRET_KEY=_DEFAULT_SECRET)
    with pytest.raises(ValidationError):
        Settings(_env_file=None, ENVIRONMENT="production", SECRET_KEY="short")
    ok = Settings(_env_file=None, ENVIRONMENT="production", SECRET_KEY="x" * 40)
    assert ok.ENVIRONMENT == "production"


def test_allowed_hosts_are_parsed_as_hostnames_list():
    s = Settings(_env_file=None, ALLOWED_HOSTS="api.example.com, www.example.com")
    assert s.ALLOWED_HOSTS == ["api.example.com", "www.example.com"]
    assert Settings(_env_file=None).ALLOWED_HOSTS == []


# --------------------------------------------------------------------------- helpers
async def _make_job(db_session, user_factory, *, title="Regression Job"):
    recruiter, _ = await user_factory(
        email=f"rr-{uuid.uuid4().hex[:6]}@example.com", role=UserRole.recruiter
    )
    name = f"Co-{uuid.uuid4().hex[:6]}"
    company = Company(
        name=name,
        slug=slugify(name),
        company_type=CompanyType.startup.value,
        owner_user_id=recruiter.id,
    )
    db_session.add(company)
    await db_session.commit()
    job = Job(
        company_id=company.id,
        posted_by_id=recruiter.id,
        title=title,
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
    return recruiter, company, job


# --------------------------------------------------------------------------- swipes
@pytest.mark.asyncio
async def test_save_then_skip_removes_saved_job_and_saved_application(
    client, user_factory, auth_headers, db_session
):
    _, _, job = await _make_job(db_session, user_factory)
    seeker, _ = await user_factory(email="reg-sw@example.com", role=UserRole.job_seeker)
    headers = await auth_headers["login"]("reg-sw@example.com", "Passw0rd!")

    r = await client.post(
        "/api/v1/swipes",
        headers=headers,
        json={"job_id": str(job.id), "direction": "right", "action": "save"},
    )
    assert r.status_code == 201, r.text

    r = await client.post(
        "/api/v1/swipes", headers=headers, json={"job_id": str(job.id), "direction": "left"}
    )
    assert r.status_code == 201, r.text

    saved = (await db_session.execute(select(SavedJob).where(SavedJob.user_id == seeker.id))).all()
    apps = (await db_session.execute(select(Application).where(Application.user_id == seeker.id))).all()
    assert saved == []
    assert apps == []


@pytest.mark.asyncio
async def test_save_then_apply_removes_saved_job_and_counts_applicant(
    client, user_factory, auth_headers, db_session
):
    _, _, job = await _make_job(db_session, user_factory)
    seeker, _ = await user_factory(email="reg-sw2@example.com", role=UserRole.job_seeker)
    headers = await auth_headers["login"]("reg-sw2@example.com", "Passw0rd!")

    await client.post(
        "/api/v1/swipes",
        headers=headers,
        json={"job_id": str(job.id), "direction": "right", "action": "save"},
    )
    r = await client.post(
        "/api/v1/swipes",
        headers=headers,
        json={"job_id": str(job.id), "direction": "right", "action": "apply"},
    )
    assert r.status_code == 201, r.text

    saved = (await db_session.execute(select(SavedJob).where(SavedJob.user_id == seeker.id))).all()
    assert saved == []
    await db_session.refresh(job)
    assert job.applicant_count == 1


# --------------------------------------------------------------------------- jobs / companies
@pytest.mark.asyncio
async def test_jobs_mine_route_is_not_shadowed_by_job_id(client, user_factory, auth_headers, db_session):
    recruiter, _, _ = await _make_job(db_session, user_factory)
    headers = await auth_headers["login"](recruiter.email, "Passw0rd!")
    r = await client.get("/api/v1/jobs/mine", headers=headers)
    assert r.status_code == 200, r.text
    assert r.json()["total"] == 1


@pytest.mark.asyncio
async def test_company_patch_returns_updated_company(client, user_factory, auth_headers, db_session):
    recruiter, company, _ = await _make_job(db_session, user_factory)
    headers = await auth_headers["login"](recruiter.email, "Passw0rd!")
    r = await client.patch(
        f"/api/v1/companies/{company.id}", headers=headers, json={"about": "Now with an about"}
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["about"] == "Now with an about"
    assert body["updated_at"]


@pytest.mark.asyncio
async def test_recruiter_applicants_list_excludes_saved_bookmarks(
    client, user_factory, auth_headers, db_session
):
    recruiter, _, job = await _make_job(db_session, user_factory)
    await user_factory(email="reg-saver@example.com", role=UserRole.job_seeker)
    seeker_headers = await auth_headers["login"]("reg-saver@example.com", "Passw0rd!")
    await client.post(
        "/api/v1/swipes",
        headers=seeker_headers,
        json={"job_id": str(job.id), "direction": "right", "action": "save"},
    )
    rec_headers = await auth_headers["login"](recruiter.email, "Passw0rd!")
    r = await client.get(f"/api/v1/jobs/{job.id}/applicants", headers=rec_headers)
    assert r.status_code == 200, r.text
    assert r.json()["total"] == 0


# --------------------------------------------------------------------------- resumes
@pytest.mark.asyncio
async def test_deleting_default_version_promotes_remaining_version(
    client, user_factory, auth_headers, make_pdf_bytes
):
    await user_factory(email="reg-res@example.com", role=UserRole.job_seeker)
    headers = await auth_headers["login"]("reg-res@example.com", "Passw0rd!")
    first = await client.post(
        "/api/v1/resumes/upload",
        headers=headers,
        files={"file": ("a.pdf", make_pdf_bytes("Python"), "application/pdf")},
    )
    assert first.status_code == 201, first.text
    second = await client.post(
        "/api/v1/resumes/upload",
        headers=headers,
        data={"resume_id": first.json()["resume_id"]},
        files={"file": ("b.pdf", make_pdf_bytes("SQL"), "application/pdf")},
    )
    assert second.status_code == 201, second.text

    r = await client.delete(f"/api/v1/resumes/versions/{first.json()['version_id']}", headers=headers)
    assert r.status_code == 204, r.text

    listing = (await client.get("/api/v1/resumes", headers=headers)).json()
    versions = [v for res in listing for v in res["versions"]]
    assert len(versions) == 1
    assert versions[0]["is_default"] is True


@pytest.mark.asyncio
async def test_zip_that_is_not_a_docx_is_rejected(client, user_factory, auth_headers):
    import io
    import zipfile

    await user_factory(email="reg-zip@example.com", role=UserRole.job_seeker)
    headers = await auth_headers["login"]("reg-zip@example.com", "Passw0rd!")
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("hello.txt", "not a word document")
    r = await client.post(
        "/api/v1/resumes/upload",
        headers=headers,
        files={"file": ("fake.docx", buf.getvalue(), "application/octet-stream")},
    )
    assert r.status_code == 415, r.text
