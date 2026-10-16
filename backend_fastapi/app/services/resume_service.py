"""Resume service — upload, versions, default, parse, download."""
from __future__ import annotations

import hashlib
import io
import logging
import re
import uuid
import zipfile
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import (
    BadRequestError,
    FileTooLargeError,
    NotFoundError,
    UnsupportedFileTypeError,
    ValidationFailedError,
)
from app.integrations.storage.factory import get_storage
from app.models.enums import ParseStatus
from app.models.resume import Resume, ResumeVersion
from app.models.user import User
from app.repositories.resume_repo import ResumeRepository
from app.services import resume_parser
from app.services.skills import extract_skills

logger = logging.getLogger(__name__)

_ALLOWED_MIME = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
}
_ALLOWED_EXT = {".pdf", ".docx"}


def _sniff_magic(data: bytes) -> str | None:
    if data[:4] == b"%PDF":
        return "application/pdf"
    if data[:2] == b"PK":
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    return None


def sanitize_filename(name: str) -> str:
    """Return a filename that is safe to store and to place in an HTTP header.

    Drops any directory part, control characters (incl. CR/LF), quotes and backslashes.
    """
    base = Path(name.replace("\\", "/")).name
    base = re.sub(r"[\x00-\x1f\x7f\"\\;]", "", base).strip()
    return base[:300] or "resume"


_sanitize_filename = sanitize_filename  # backwards-compatible alias


def _is_valid_docx(data: bytes) -> bool:
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as zf:
            return "word/document.xml" in zf.namelist()
    except zipfile.BadZipFile:
        return False


class ResumeService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = ResumeRepository(db)
        self.storage = get_storage()

    # ---------- ownership guards ----------
    async def _get_owned_resume(self, user: User, resume_id: uuid.UUID) -> Resume:
        resume = await self.repo.get(resume_id)
        if resume is None or resume.user_id != user.id:
            # 404 (not 403) to avoid leaking existence
            raise NotFoundError("Resume not found")
        return resume

    async def _get_owned_version(self, user: User, version_id: uuid.UUID) -> ResumeVersion:
        version = await self.repo.get_version(version_id)
        if version is None or version.user_id != user.id:
            raise NotFoundError("Resume version not found")
        return version

    # ---------- upload ----------
    async def upload(
        self,
        *,
        user: User,
        file_bytes: bytes,
        filename: str,
        content_type: str | None,
        title: str | None,
        resume_id: uuid.UUID | None,
    ) -> dict:
        max_bytes = settings.MAX_RESUME_SIZE_MB * 1024 * 1024
        if len(file_bytes) > max_bytes:
            raise FileTooLargeError(f"Resume exceeds {settings.MAX_RESUME_SIZE_MB} MB")

        sniffed = _sniff_magic(file_bytes)
        if sniffed is None:
            raise UnsupportedFileTypeError("File is not a valid PDF or DOCX")
        # Always trust the file's magic bytes over the client-declared content type.
        ct = sniffed
        ext = _ALLOWED_MIME[sniffed]
        if ext == ".docx" and not _is_valid_docx(file_bytes):
            raise UnsupportedFileTypeError("File is not a valid DOCX document")
        safe_name = sanitize_filename(filename or "resume" + ext)
        if not safe_name.lower().endswith(ext):
            safe_name = safe_name + ext

        checksum = hashlib.sha256(file_bytes).hexdigest()

        if resume_id is None:
            resume = await self.repo.create_resume(
                user_id=user.id, title=title or safe_name
            )
        else:
            resume = await self._get_owned_resume(user, resume_id)

        version_number = await self.repo.next_version_number(resume.id)
        key = f"resumes/{user.id}/{uuid.uuid4().hex}{ext}"
        self.storage.save(key, file_bytes, ct)

        # First-ever version for this user becomes default automatically
        has_default = await self.repo.get_default_version(user.id)
        is_default = has_default is None

        version = await self.repo.create_version(
            resume_id=resume.id,
            user_id=user.id,
            version_number=version_number,
            original_filename=safe_name,
            content_type=ct,
            file_size_bytes=len(file_bytes),
            storage_key=key,
            checksum_sha256=checksum,
            parse_status=ParseStatus.pending.value,
            is_default=is_default,
        )
        await self.db.commit()
        return {
            "resume_id": str(resume.id),
            "version_id": str(version.id),
            "version_number": version.version_number,
            "parse_status": version.parse_status,
        }

    # ---------- list / get ----------
    async def list_resumes(self, user: User) -> list[Resume]:
        return await self.repo.list_for_user(user.id)

    async def get_resume(self, user: User, resume_id: uuid.UUID) -> Resume:
        return await self._get_owned_resume(user, resume_id)

    async def get_version(self, user: User, version_id: uuid.UUID) -> ResumeVersion:
        return await self._get_owned_version(user, version_id)

    # ---------- download ----------
    async def open_version_stream(self, user: User, version_id: uuid.UUID):
        version = await self._get_owned_version(user, version_id)
        stream = self.storage.open(version.storage_key)
        return version, stream

    # ---------- default ----------
    async def set_default(self, user: User, version_id: uuid.UUID) -> ResumeVersion:
        version = await self._get_owned_version(user, version_id)
        await self.repo.clear_default_for_user(user.id)
        await self.repo.set_default(version.id)
        await self.db.commit()
        refreshed = await self.repo.get_version(version.id)
        assert refreshed is not None
        return refreshed

    # ---------- delete ----------
    async def delete_version(self, user: User, version_id: uuid.UUID) -> None:
        version = await self._get_owned_version(user, version_id)
        was_default = version.is_default
        storage_key = version.storage_key
        # The delete is flushed inside the repository, so the lookup below can no longer
        # see the removed row (autoflush is disabled on the session).
        await self.repo.delete_version(version)
        # If we deleted the default, promote the user's most recent remaining version
        # (across all of the user's resumes) so a default always exists when any version does.
        if was_default:
            newest = await self.repo.latest_version_for_user(user.id)
            if newest is not None:
                await self.repo.set_default(newest.id)
        # Storage cleanup is best-effort
        try:
            self.storage.delete(storage_key)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Storage delete failed for %s: %s", storage_key, exc)
        await self.db.commit()

    # ---------- parse ----------
    async def parse(
        self, *, user: User, resume_id: uuid.UUID, version_id: uuid.UUID | None
    ) -> dict:
        resume = await self._get_owned_resume(user, resume_id)
        if version_id is not None:
            version = await self._get_owned_version(user, version_id)
            if version.resume_id != resume.id:
                raise BadRequestError("Version does not belong to this resume")
        else:
            default = await self.repo.get_default_version(user.id)
            if default is None or default.resume_id != resume.id:
                # fall back to newest version of this resume
                if not resume.versions:
                    raise NotFoundError("No version available to parse")
                version = max(resume.versions, key=lambda v: v.version_number)
            else:
                version = default

        try:
            with self.storage.open(version.storage_key) as fh:
                data = fh.read()
            text = resume_parser.extract_text(data, version.content_type)
        except Exception as exc:  # noqa: BLE001
            version.parse_status = ParseStatus.failed.value
            version.parse_error = str(exc)[:1000]
            await self.db.commit()
            raise ValidationFailedError(f"Resume parsing failed: {exc}")

        experience = resume_parser.extract_experience(text)
        matched = extract_skills(text)
        skill_rows = [
            {
                "skill_name": entry.normalized,
                "normalized_name": entry.normalized,
                "category": entry.category,
                "confidence": confidence,
            }
            for entry, confidence in matched
        ]

        version.parsed_text = text
        version.parsed_experience = {"items": experience}
        version.parse_status = ParseStatus.parsed.value
        version.parse_error = None
        await self.repo.replace_skills(version_id=version.id, skills=skill_rows)
        await self.db.commit()

        refreshed = await self.repo.get_version(version.id)
        assert refreshed is not None
        return {
            "version_id": str(refreshed.id),
            "parse_status": refreshed.parse_status,
            "parsed_experience": refreshed.parsed_experience,
            "skills": [
                {
                    "skill_name": s.skill_name,
                    "normalized_name": s.normalized_name,
                    "category": s.category,
                    "confidence": s.confidence,
                    "years": s.years,
                }
                for s in refreshed.skills
            ],
            "parse_error": refreshed.parse_error,
        }