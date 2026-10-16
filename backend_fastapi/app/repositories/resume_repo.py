"""Resume repository."""
from __future__ import annotations

import uuid

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.resume import Resume, ResumeSkill, ResumeVersion


class ResumeRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ---------- resumes ----------
    async def list_for_user(self, user_id: uuid.UUID) -> list[Resume]:
        stmt = (
            select(Resume)
            .where(Resume.user_id == user_id)
            .options(selectinload(Resume.versions).selectinload(ResumeVersion.skills))
            .order_by(Resume.created_at.desc())
        )
        return list((await self.db.execute(stmt)).unique().scalars().all())

    async def get(self, resume_id: uuid.UUID) -> Resume | None:
        stmt = (
            select(Resume)
            .where(Resume.id == resume_id)
            .options(selectinload(Resume.versions).selectinload(ResumeVersion.skills))
        )
        return (await self.db.execute(stmt)).unique().scalar_one_or_none()

    async def create_resume(self, *, user_id: uuid.UUID, title: str) -> Resume:
        resume = Resume(user_id=user_id, title=title)
        self.db.add(resume)
        await self.db.flush()
        return resume

    # ---------- versions ----------
    async def get_version(self, version_id: uuid.UUID) -> ResumeVersion | None:
        stmt = (
            select(ResumeVersion)
            .where(ResumeVersion.id == version_id)
            .options(selectinload(ResumeVersion.skills))
        )
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def get_default_version(self, user_id: uuid.UUID) -> ResumeVersion | None:
        stmt = (
            select(ResumeVersion)
            .where(ResumeVersion.user_id == user_id, ResumeVersion.is_default.is_(True))
            .options(selectinload(ResumeVersion.skills))
        )
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def next_version_number(self, resume_id: uuid.UUID) -> int:
        stmt = select(func.coalesce(func.max(ResumeVersion.version_number), 0)).where(
            ResumeVersion.resume_id == resume_id
        )
        n = int((await self.db.execute(stmt)).scalar_one())
        return n + 1

    async def create_version(self, **fields) -> ResumeVersion:
        version = ResumeVersion(**fields)
        self.db.add(version)
        await self.db.flush()
        return version

    async def clear_default_for_user(self, user_id: uuid.UUID) -> None:
        stmt = (
            update(ResumeVersion)
            .where(ResumeVersion.user_id == user_id, ResumeVersion.is_default.is_(True))
            .values(is_default=False)
        )
        await self.db.execute(stmt)

    async def set_default(self, version_id: uuid.UUID) -> None:
        stmt = (
            update(ResumeVersion)
            .where(ResumeVersion.id == version_id)
            .values(is_default=True)
        )
        await self.db.execute(stmt)

    async def delete_version(self, version: ResumeVersion) -> None:
        await self.db.delete(version)
        await self.db.flush()

    async def latest_version_for_user(self, user_id: uuid.UUID) -> ResumeVersion | None:
        stmt = (
            select(ResumeVersion)
            .where(ResumeVersion.user_id == user_id)
            .order_by(ResumeVersion.created_at.desc(), ResumeVersion.version_number.desc())
            .limit(1)
        )
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def delete_resume(self, resume: Resume) -> None:
        await self.db.delete(resume)

    async def count_versions_for_user(self, user_id: uuid.UUID) -> int:
        stmt = select(func.count()).select_from(ResumeVersion).where(ResumeVersion.user_id == user_id)
        return int((await self.db.execute(stmt)).scalar_one())

    # ---------- skills ----------
    async def replace_skills(
        self, *, version_id: uuid.UUID, skills: list[dict]
    ) -> None:
        await self.db.execute(
            ResumeSkill.__table__.delete().where(ResumeSkill.resume_version_id == version_id)
        )
        for s in skills:
            self.db.add(
                ResumeSkill(
                    resume_version_id=version_id,
                    skill_name=s["skill_name"],
                    normalized_name=s["normalized_name"],
                    category=s.get("category"),
                    confidence=s.get("confidence"),
                    years=s.get("years"),
                )
            )
        await self.db.flush()

    async def list_skills(self, version_id: uuid.UUID) -> list[ResumeSkill]:
        stmt = select(ResumeSkill).where(ResumeSkill.resume_version_id == version_id)
        return list((await self.db.execute(stmt)).scalars().all())