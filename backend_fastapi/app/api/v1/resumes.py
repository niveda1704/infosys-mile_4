"""Resume endpoints — job seeker only."""
from __future__ import annotations

import contextlib
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Response, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_job_seeker
from app.core.config import settings
from app.core.exceptions import BadRequestError, FileTooLargeError, NotFoundError
from app.models.enums import ParseStatus
from app.models.user import User
from app.schemas.resume import (
    ResumeParseRequest,
    ResumeParseResponse,
    ResumeResponse,
    ResumeSkillResponse,
    ResumeUploadResponse,
    ResumeVersionResponse,
)
from app.services.resume_service import ResumeService, sanitize_filename

router = APIRouter(prefix="/resumes", tags=["resumes"])


def _version_response(v) -> ResumeVersionResponse:
    return ResumeVersionResponse(
        id=str(v.id),
        resume_id=str(v.resume_id),
        version_number=v.version_number,
        original_filename=v.original_filename,
        content_type=v.content_type,
        file_size_bytes=v.file_size_bytes,
        storage_key=v.storage_key,
        checksum_sha256=v.checksum_sha256,
        parse_status=ParseStatus(v.parse_status),
        parse_error=v.parse_error,
        is_default=v.is_default,
        created_at=v.created_at,
        skills=[
            ResumeSkillResponse(
                skill_name=s.skill_name,
                normalized_name=s.normalized_name,
                category=s.category,
                confidence=s.confidence,
                years=s.years,
            )
            for s in (v.skills or [])
        ],
    )


def _resume_response(r) -> ResumeResponse:
    return ResumeResponse(
        id=str(r.id),
        user_id=str(r.user_id),
        title=r.title,
        created_at=r.created_at,
        updated_at=r.updated_at,
        versions=[_version_response(v) for v in (r.versions or [])],
    )


_CHUNK = 64 * 1024


async def _read_capped(file: UploadFile) -> bytes:
    """Read an upload in chunks and abort as soon as it exceeds MAX_RESUME_SIZE_MB."""
    limit = settings.MAX_RESUME_SIZE_MB * 1024 * 1024
    buf = bytearray()
    while True:
        chunk = await file.read(_CHUNK)
        if not chunk:
            break
        buf.extend(chunk)
        if len(buf) > limit:
            raise FileTooLargeError(f"Resume exceeds {settings.MAX_RESUME_SIZE_MB} MB")
    return bytes(buf)


def _iter_and_close(fh):
    """Yield a storage handle in chunks and always release it afterwards."""
    try:
        while True:
            block = fh.read(_CHUNK)
            if not block:
                break
            yield block
    finally:
        for name in ("close", "release_conn"):
            fn = getattr(fh, name, None)
            if callable(fn):
                with contextlib.suppress(Exception):  # cleanup must never raise
                    fn()


@router.post(
    "/upload",
    response_model=ResumeUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a resume (job seeker)",
)
async def upload_resume(
    user: Annotated[User, Depends(require_job_seeker)],
    file: UploadFile = File(...),
    title: str | None = Form(default=None, max_length=200),
    resume_id: str | None = Form(default=None),
    db: AsyncSession = Depends(get_db),
) -> ResumeUploadResponse:
    data = await _read_capped(file)
    rid = None
    if resume_id:
        try:
            rid = uuid.UUID(resume_id)
        except ValueError:
            raise BadRequestError("Invalid resume_id")
    result = await ResumeService(db).upload(
        user=user,
        file_bytes=data,
        filename=file.filename or "resume",
        content_type=file.content_type,
        title=title,
        resume_id=rid,
    )
    return ResumeUploadResponse(**result)


@router.get(
    "",
    response_model=list[ResumeResponse],
    summary="List my resumes (job seeker)",
)
async def list_resumes(
    user: Annotated[User, Depends(require_job_seeker)],
    db: AsyncSession = Depends(get_db),
) -> list[ResumeResponse]:
    rows = await ResumeService(db).list_resumes(user)
    return [_resume_response(r) for r in rows]


@router.get(
    "/{resume_id}",
    response_model=ResumeResponse,
    summary="Get one resume (job seeker)",
)
async def get_resume(
    resume_id: uuid.UUID,
    user: Annotated[User, Depends(require_job_seeker)],
    db: AsyncSession = Depends(get_db),
) -> ResumeResponse:
    r = await ResumeService(db).get_resume(user, resume_id)
    return _resume_response(r)


@router.get(
    "/{resume_id}/versions/{version_id}",
    response_model=ResumeVersionResponse,
    summary="Get one resume version (job seeker)",
)
async def get_version(
    resume_id: uuid.UUID,
    version_id: uuid.UUID,
    user: Annotated[User, Depends(require_job_seeker)],
    db: AsyncSession = Depends(get_db),
) -> ResumeVersionResponse:
    v = await ResumeService(db).get_version(user, version_id)
    if v.resume_id != resume_id:
        raise NotFoundError("Resume version not found")
    return _version_response(v)


@router.get(
    "/versions/{version_id}/download",
    summary="Download a resume version (job seeker)",
)
async def download_version(
    version_id: uuid.UUID,
    user: Annotated[User, Depends(require_job_seeker)],
    db: AsyncSession = Depends(get_db),
):
    version, stream = await ResumeService(db).open_version_stream(user, version_id)
    return StreamingResponse(
        _iter_and_close(stream),
        media_type=version.content_type,
        headers={
            "Content-Disposition": f'attachment; filename="{sanitize_filename(version.original_filename)}"',
        },
    )


@router.patch(
    "/versions/{version_id}/default",
    response_model=ResumeVersionResponse,
    summary="Set a resume version as default (job seeker)",
)
async def set_default_version(
    version_id: uuid.UUID,
    user: Annotated[User, Depends(require_job_seeker)],
    db: AsyncSession = Depends(get_db),
) -> ResumeVersionResponse:
    v = await ResumeService(db).set_default(user, version_id)
    return _version_response(v)

@router.delete(
    "/versions/{version_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Delete a resume version (job seeker)",
)
async def delete_version(
    version_id: uuid.UUID,
    user: Annotated[User, Depends(require_job_seeker)],
    db: AsyncSession = Depends(get_db),
) -> Response:
    await ResumeService(db).delete_version(user, version_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post(
    "/{resume_id}/parse",
    response_model=ResumeParseResponse,
    summary="Parse a resume version (job seeker)",
)
async def parse_resume(
    resume_id: uuid.UUID,
    user: Annotated[User, Depends(require_job_seeker)],
    payload: ResumeParseRequest | None = None,
    db: AsyncSession = Depends(get_db),
) -> ResumeParseResponse:
    version_id = None
    if payload and payload.version_id:
        try:
            version_id = uuid.UUID(payload.version_id)
        except ValueError:
            raise BadRequestError("Invalid version_id")
    result = await ResumeService(db).parse(
        user=user, resume_id=resume_id, version_id=version_id
    )
    return ResumeParseResponse(**result)