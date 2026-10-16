"""Upload abuse: wrong magic bytes, oversize, bad filename, wrong content type."""
from __future__ import annotations

import pytest

from app.models.enums import UserRole


@pytest.mark.asyncio
async def test_upload_rejects_wrong_magic_bytes(client, user_factory, auth_headers):
    await user_factory(email="ua1@example.com", role=UserRole.job_seeker)
    headers = await auth_headers["login"]("ua1@example.com", "Passw0rd!")
    r = await client.post(
        "/api/v1/resumes/upload",
        headers=headers,
        files={"file": ("evil.pdf", b"\x89PNG\r\n\x1a\nISNOTAPDF", "application/pdf")},
    )
    assert r.status_code == 415
    assert r.json()["error"]["code"] == "UNSUPPORTED_FILE_TYPE"


@pytest.mark.asyncio
async def test_upload_rejects_oversize(client, user_factory, auth_headers):
    await user_factory(email="ua2@example.com", role=UserRole.job_seeker)
    headers = await auth_headers["login"]("ua2@example.com", "Passw0rd!")

    payload = b"%PDF-1.4\n" + b"0" * (6 * 1024 * 1024)
    r = await client.post(
        "/api/v1/resumes/upload",
        headers=headers,
        files={"file": ("big.pdf", payload, "application/pdf")},
    )
    assert r.status_code == 413
    assert r.json()["error"]["code"] == "FILE_TOO_LARGE"


@pytest.mark.asyncio
async def test_upload_sanitizes_filename(client, user_factory, auth_headers, make_pdf_bytes):
    await user_factory(email="ua3@example.com", role=UserRole.job_seeker)
    headers = await auth_headers["login"]("ua3@example.com", "Passw0rd!")
    r = await client.post(
        "/api/v1/resumes/upload",
        headers=headers,
        files={"file": ("../../etc/passwd.pdf", make_pdf_bytes("x"), "application/pdf")},
    )
    assert r.status_code == 201
    listing = await client.get("/api/v1/resumes", headers=headers)
    fn = listing.json()[0]["versions"][0]["original_filename"]
    assert ".." not in fn
    assert "/" not in fn


@pytest.mark.asyncio
async def test_upload_rejects_unsupported_content_type(client, user_factory, auth_headers):
    await user_factory(email="ua4@example.com", role=UserRole.job_seeker)
    headers = await auth_headers["login"]("ua4@example.com", "Passw0rd!")
    r = await client.post(
        "/api/v1/resumes/upload",
        headers=headers,
        files={"file": ("file.txt", b"just text", "text/plain")},
    )
    assert r.status_code == 415