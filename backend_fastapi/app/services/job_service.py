"""Job service — CRUD, search, and side effects."""
from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.company import Company
from app.models.enums import ExperienceLevel, UserRole
from app.models.job import Job
from app.models.user import User
from app.repositories.company_repo import CompanyRepository
from app.repositories.job_repo import JobRepository
from app.schemas.job import JobCreate, JobUpdate
from app.services.competition_service import freshness, recompute_competition


def _derive_fresher_friendly(experience_level: str | None, min_years: int | None) -> bool:
    if experience_level == ExperienceLevel.fresher.value:
        return True
    if min_years is not None and min_years == 0:
        return True
    return False


class JobService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = JobRepository(db)
        self.companies = CompanyRepository(db)

    # ---------- reads ----------
    async def get(self, jid: uuid.UUID) -> Job:
        job = await self.repo.get_by_id(jid)
        if job is None:
            raise NotFoundError("Job not found")
        return job

    async def search(self, **kwargs) -> tuple[list[Job], int]:
        return await self.repo.search(**kwargs)

    async def list_mine(self, user: User, page: int = 1, page_size: int = 20):
        return await self.repo.list_by_owner(posted_by_id=user.id, page=page, page_size=page_size)

    async def list_by_company(self, company_id: uuid.UUID, page: int = 1, page_size: int = 20):
        return await self.repo.list_by_company(company_id=company_id, page=page, page_size=page_size)

    # ---------- create/update ----------
    async def create(self, user: User, payload: JobCreate) -> Job:
        if user.role not in (UserRole.recruiter.value, UserRole.admin.value):
            raise ForbiddenError("Only recruiters or admins can create jobs")
        try:
            company_id = uuid.UUID(payload.company_id)
        except ValueError:
            raise NotFoundError("Company not found")
        company = await self.companies.get_by_id(company_id)
        if company is None:
            raise NotFoundError("Company not found")
        if user.role == UserRole.recruiter.value and company.owner_user_id != user.id:
            raise ForbiddenError("You do not own this company")

        data: dict[str, Any] = payload.model_dump(exclude={"company_id"})
        data["company_id"] = company_id
        data["posted_by_id"] = user.id
        data["is_remote"] = data.get("work_mode") == "remote"
        data["is_fresher_friendly"] = _derive_fresher_friendly(
            data.get("experience_level"), data.get("min_experience_years")
        )
        job = await self.repo.create(**data)
        recompute_competition(job)
        await self.db.commit()
        await self.db.refresh(job)
        return job

    async def update(self, user: User, jid: uuid.UUID, payload: JobUpdate) -> Job:
        job = await self.repo.get_by_id(jid)
        if job is None:
            raise NotFoundError("Job not found")
        if user.role != UserRole.admin.value and job.posted_by_id != user.id:
            raise ForbiddenError("You do not own this job")

        fields = payload.model_dump(exclude_unset=True)
        if "work_mode" in fields and "is_remote" not in fields:
            fields["is_remote"] = fields["work_mode"] == "remote"
        if "experience_level" in fields or "min_experience_years" in fields:
            exp = fields.get("experience_level", job.experience_level)
            yrs = fields.get("min_experience_years", job.min_experience_years)
            fields["is_fresher_friendly"] = _derive_fresher_friendly(exp, yrs)

        job = await self.repo.update(job, **fields)
        recompute_competition(job)
        await self.db.commit()
        return job

    async def soft_delete(self, user: User, jid: uuid.UUID) -> None:
        job = await self.repo.get_by_id(jid)
        if job is None:
            raise NotFoundError("Job not found")
        if user.role != UserRole.admin.value and job.posted_by_id != user.id:
            raise ForbiddenError("You do not own this job")
        await self.repo.soft_delete(job)
        await self.db.commit()

    # ---------- competition ----------
    async def get_competition(self, jid: uuid.UUID) -> dict:
        job = await self.repo.get_by_id(jid)
        if job is None:
            raise NotFoundError("Job not found")
        fresh = freshness(job)
        return {
            "applicant_count": job.applicant_count,
            "competition_level": job.competition_level,
            "posted_at": job.posted_at,
            "hours_since_posted": fresh["hours_since_posted"],
            "early_window_open": fresh["is_early_window_open"],
        }

    async def recompute_all_competition(self) -> int:
        count = await self.repo.recompute_competition_for_all(
            low_max=settings.COMPETITION_LOW_MAX,
            medium_max=settings.COMPETITION_MEDIUM_MAX,
        )
        await self.db.commit()
        return count

    async def assert_owner_or_admin(self, user: User, job: Job) -> None:
        if user.role != UserRole.admin.value and job.posted_by_id != user.id:
            raise ForbiddenError("You do not own this job")