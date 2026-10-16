"""Job repository — all job queries live here."""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import and_, func, or_, select, update
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.company import Company
from app.models.enums import CompetitionLevel
from app.models.job import Job


class JobRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ---------- reads ----------
    async def get_by_id(self, jid: uuid.UUID, *, with_company: bool = True) -> Job | None:
        stmt = select(Job).where(Job.id == jid)
        if with_company:
            stmt = stmt.options(joinedload(Job.company))
        return (await self.db.execute(stmt)).unique().scalar_one_or_none()

    async def create(self, **fields) -> Job:
        job = Job(**fields)
        self.db.add(job)
        await self.db.flush()
        return job

    async def update(self, job: Job, **fields) -> Job:
        for k, v in fields.items():
            setattr(job, k, v)
        await self.db.flush()
        return job

    async def soft_delete(self, job: Job) -> None:
        job.is_active = False
        await self.db.flush()

    async def increment_applicant_count(self, job_id: uuid.UUID, delta: int = 1) -> None:
        stmt = update(Job).where(Job.id == job_id).values(
            applicant_count=func.greatest(Job.applicant_count + delta, 0)
        )
        await self.db.execute(stmt)

    async def update_competition_level(self, job_id: uuid.UUID, level: CompetitionLevel) -> None:
        stmt = update(Job).where(Job.id == job_id).values(competition_level=level.value)
        await self.db.execute(stmt)

    # ---------- search ----------
    async def search(
        self,
        *,
        q: str | None = None,
        location: str | None = None,
        job_type: str | None = None,
        work_mode: str | None = None,
        remote: bool | None = None,
        company_type: str | None = None,
        salary_min: int | None = None,
        salary_max: int | None = None,
        experience_level: str | None = None,
        skills: list[str] | None = None,
        skills_match: str = "any",
        fresher_friendly: bool | None = None,
        low_competition: bool | None = None,
        recently_posted: bool | None = None,
        competition_level: str | None = None,
        sort: str = "posted_at",
        page: int = 1,
        page_size: int = 20,
        fresh_days: int = 7,
        exclude_ids: list[uuid.UUID] | None = None,
        only_active: bool = True,
    ) -> tuple[list[Job], int]:
        conditions: list[Any] = []

        if only_active:
            conditions.append(Job.is_active.is_(True))

        if q:
            pattern = f"%{q}%"
            conditions.append(
                or_(
                    Job.title.ilike(pattern),
                    Job.description.ilike(pattern),
                    Company.name.ilike(pattern),
                )
            )

        if location:
            conditions.append(Job.location.ilike(f"%{location}%"))

        if job_type:
            conditions.append(Job.job_type == job_type)
        if work_mode:
            conditions.append(Job.work_mode == work_mode)
        if remote is True:
            conditions.append(Job.is_remote.is_(True))
        if remote is False:
            conditions.append(Job.is_remote.is_(False))

        if company_type:
            conditions.append(Company.company_type == company_type)

        # salary overlap: job's [salary_min, salary_max] overlaps [salary_min_query, salary_max_query]
        if salary_min is not None:
            conditions.append(or_(Job.salary_max.is_(None), Job.salary_max >= salary_min))
        if salary_max is not None:
            conditions.append(or_(Job.salary_min.is_(None), Job.salary_min <= salary_max))

        if experience_level:
            conditions.append(Job.experience_level == experience_level)

        if skills:
            cleaned = [s.strip() for s in skills if s.strip()]
            if cleaned:
                if skills_match == "all":
                    conditions.append(Job.skills.contains(cleaned))
                else:
                    # ANY: overlap (&&)
                    conditions.append(Job.skills.overlap(cleaned))

        if fresher_friendly:
            conditions.append(Job.is_fresher_friendly.is_(True))

        if low_competition:
            conditions.append(Job.competition_level == CompetitionLevel.low.value)

        if recently_posted:
            cutoff = datetime.now(timezone.utc) - timedelta(days=fresh_days)
            conditions.append(Job.posted_at >= cutoff)

        if competition_level:
            conditions.append(Job.competition_level == competition_level)

        if exclude_ids:
            conditions.append(Job.id.notin_(exclude_ids))

        base = select(Job).join(Company, Job.company_id == Company.id)
        count_base = select(func.count()).select_from(Job).join(
            Company, Job.company_id == Company.id
        )
        if conditions:
            base = base.where(and_(*conditions))
            count_base = count_base.where(and_(*conditions))

        # sorting
        if sort == "salary":
            base = base.order_by(Job.salary_max.desc().nullslast(), Job.posted_at.desc())
        elif sort == "competition":
            # low < medium < high — order by applicant_count ascending as proxy
            base = base.order_by(Job.applicant_count.asc(), Job.posted_at.desc())
        elif sort == "match":
            # match ordering is handled in service layer; fall back to posted_at here
            base = base.order_by(Job.posted_at.desc())
        else:
            base = base.order_by(Job.posted_at.desc())

        total = int((await self.db.execute(count_base)).scalar_one())
        base = base.options(joinedload(Job.company)).offset((page - 1) * page_size).limit(page_size)
        rows = list((await self.db.execute(base)).unique().scalars().all())
        return rows, total

    async def list_by_owner(
        self, *, posted_by_id: uuid.UUID, page: int = 1, page_size: int = 20
    ) -> tuple[list[Job], int]:
        stmt = (
            select(Job)
            .where(Job.posted_by_id == posted_by_id)
            .options(joinedload(Job.company))
            .order_by(Job.posted_at.desc())
        )
        count_stmt = (
            select(func.count())
            .select_from(Job)
            .where(Job.posted_by_id == posted_by_id)
        )
        total = int((await self.db.execute(count_stmt)).scalar_one())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        rows = list((await self.db.execute(stmt)).unique().scalars().all())
        return rows, total

    async def list_by_company(
        self, *, company_id: uuid.UUID, page: int = 1, page_size: int = 20
    ) -> tuple[list[Job], int]:
        stmt = (
            select(Job)
            .where(Job.company_id == company_id, Job.is_active.is_(True))
            .options(joinedload(Job.company))
            .order_by(Job.posted_at.desc())
        )
        count_stmt = (
            select(func.count())
            .select_from(Job)
            .where(Job.company_id == company_id, Job.is_active.is_(True))
        )
        total = int((await self.db.execute(count_stmt)).scalar_one())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        rows = list((await self.db.execute(stmt)).unique().scalars().all())
        return rows, total

    async def list_all_active(self) -> list[Job]:
        stmt = (
            select(Job)
            .where(Job.is_active.is_(True))
            .options(joinedload(Job.company))
        )
        return list((await self.db.execute(stmt)).unique().scalars().all())

    async def recompute_competition_for_all(self, low_max: int, medium_max: int) -> int:
        """Return number of rows touched."""
        rows = list((await self.db.execute(select(Job))).scalars().all())
        count = 0
        for job in rows:
            if job.applicant_count <= low_max:
                new_level = CompetitionLevel.low
            elif job.applicant_count <= medium_max:
                new_level = CompetitionLevel.medium
            else:
                new_level = CompetitionLevel.high
            if job.competition_level != new_level.value:
                job.competition_level = new_level.value
                count += 1
        await self.db.flush()
        return count