"""Resume upload / parse / versioning tests."""
from __future__ import annotations

import pytest

from app.models.enums import UserRole


@pytest.mark.asyncio
async def test_upload_pdf_and_list(client, user_factory, auth_headers, make_pdf_bytes):
    await user_factory(email="res1@example.com", role=UserRole.job_seeker)
    headers = await auth_headers["login"]("res1@example.com", "Passw0rd!")
    pdf = make_pdf_bytes("Python, FastAPI, PostgreSQL")

    r = await client.post(
        "/api/v1/resumes/upload",
        headers=headers,
        files={"file": ("cv.pdf", pdf, "application/pdf")},
    )
    assert r.status_code == 201, r.text
    assert r.json()["version_number"] == 1

    listing = await client.get("/api/v1/resumes", headers=headers)
    assert listing.status_code == 200
    body = listing.json()
    assert len(body) == 1
    assert len(body[0]["versions"]) == 1
    assert body[0]["versions"][0]["is_default"] is True


@pytest.mark.asyncio
async def test_upload_docx_and_parse(client, user_factory, auth_headers, make_docx_bytes):
    await user_factory(email="res2@example.com", role=UserRole.job_seeker)
    headers = await auth_headers["login"]("res2@example.com", "Passw0rd!")
    docx = make_docx_bytes(
        "Skills: Python, SQL, React. Experience: Senior Engineer at Acme 2020 - 2023"
    )

    up = await client.post(
        "/api/v1/resumes/upload",
        headers=headers,
        files={
            "file": (
                "cv.docx",
                docx,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )
    assert up.status_code == 201, up.text
    resume_id = up.json()["resume_id"]

    parse = await client.post(f"/api/v1/resumes/{resume_id}/parse", headers=headers)
    assert parse.status_code == 200, parse.text
    body = parse.json()
    assert body["parse_status"] == "parsed"
    names = {s["normalized_name"] for s in body["skills"]}
    assert {"python", "sql", "react"}.issubset(names)


@pytest.mark.asyncio
async def test_upload_rejects_wrong_magic_bytes(client, user_factory, auth_headers):
    await user_factory(email="res3@example.com", role=UserRole.job_seeker)
    headers = await auth_headers["login"]("res3@example.com", "Passw0rd!")
    r = await client.post(
        "/api/v1/resumes/upload",
        headers=headers,
        files={"file": ("fake.pdf", b"NOTPDF", "application/pdf")},
    )
    assert r.status_code == 415


@pytest.mark.asyncio
async def test_second_version_not_default(client, user_factory, auth_headers, make_pdf_bytes):
    await user_factory(email="res4@example.com", role=UserRole.job_seeker)
    headers = await auth_headers["login"]("res4@example.com", "Passw0rd!")

    first = await client.post(
        "/api/v1/resumes/upload",
        headers=headers,
        files={"file": ("v1.pdf", make_pdf_bytes("one"), "application/pdf")},
    )
    assert first.status_code == 201
    rid = first.json()["resume_id"]

    second = await client.post(
        "/api/v1/resumes/upload",
        headers=headers,
        data={"resume_id": rid},
        files={"file": ("v2.pdf", make_pdf_bytes("two"), "application/pdf")},
    )
    assert second.status_code == 201
    assert second.json()["version_number"] == 2

    listing = await client.get("/api/v1/resumes", headers=headers)
    versions = listing.json()[0]["versions"]
    defaults = [v for v in versions if v["is_default"]]
    assert len(defaults) == 1
    assert defaults[0]["version_number"] == 1


@pytest.mark.asyncio
async def test_set_default_switches_atomically(client, user_factory, auth_headers, make_pdf_bytes):
    await user_factory(email="res5@example.com", role=UserRole.job_seeker)
    headers = await auth_headers["login"]("res5@example.com", "Passw0rd!")
    first = await client.post(
        "/api/v1/resumes/upload",
        headers=headers,
        files={"file": ("v1.pdf", make_pdf_bytes("a"), "application/pdf")},
    )
    rid = first.json()["resume_id"]
    second = await client.post(
        "/api/v1/resumes/upload",
        headers=headers,
        data={"resume_id": rid},
        files={"file": ("v2.pdf", make_pdf_bytes("b"), "application/pdf")},
    )
    v2 = second.json()["version_id"]

    r = await client.patch(f"/api/v1/resumes/versions/{v2}/default", headers=headers)
    assert r.status_code == 200
    listing = await client.get("/api/v1/resumes", headers=headers)
    versions = listing.json()[0]["versions"]
    defaults = [v for v in versions if v["is_default"]]
    assert len(defaults) == 1
    assert defaults[0]["id"] == v2


@pytest.mark.asyncio
async def test_delete_default_promotes_next(client, user_factory, auth_headers, make_pdf_bytes):
    await user_factory(email="res6@example.com", role=UserRole.job_seeker)
    headers = await auth_headers["login"]("res6@example.com", "Passw0rd!")
    first = await client.post(
        "/api/v1/resumes/upload",
        headers=headers,
        files={"file": ("v1.pdf", make_pdf_bytes("a"), "application/pdf")},
    )
    rid = first.json()["resume_id"]
    v1 = first.json()["version_id"]
    second = await client.post(
        "/api/v1/resumes/upload",
        headers=headers,
        data={"resume_id": rid},
        files={"file": ("v2.pdf", make_pdf_bytes("b"), "application/pdf")},
    )
    v2 = second.json()["version_id"]

    d = await client.delete(f"/api/v1/resumes/versions/{v1}", headers=headers)
    assert d.status_code == 204
    listing = await client.get("/api/v1/resumes", headers=headers)
    versions = listing.json()[0]["versions"]
    assert len(versions) == 1
    assert versions[0]["id"] == v2
    assert versions[0]["is_default"] is True


@pytest.mark.asyncio
async def test_recruiter_cannot_upload(client, user_factory, auth_headers, make_pdf_bytes):
    await user_factory(email="recres@example.com", role=UserRole.recruiter)
    headers = await auth_headers["login"]("recres@example.com", "Passw0rd!")
    r = await client.post(
        "/api/v1/resumes/upload",
        headers=headers,
        files={"file": ("cv.pdf", make_pdf_bytes("x"), "application/pdf")},
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_user_cannot_access_others_resume(
    client, user_factory, auth_headers, make_pdf_bytes
):
    a, _ = await user_factory(email="resa@example.com", role=UserRole.job_seeker)
    b, _ = await user_factory(email="resb@example.com", role=UserRole.job_seeker)

    headers_a = await auth_headers["login"]("resa@example.com", "Passw0rd!")
    headers_b = await auth_headers["login"]("resb@example.com", "Passw0rd!")

    up = await client.post(
        "/api/v1/resumes/upload",
        headers=headers_a,
        files={"file": ("cv.pdf", make_pdf_bytes("a"), "application/pdf")},
    )
    rid = up.json()["resume_id"]
    r = await client.get(f"/api/v1/resumes/{rid}", headers=headers_b)
    assert r.status_code == 404