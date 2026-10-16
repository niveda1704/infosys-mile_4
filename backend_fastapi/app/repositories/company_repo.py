"""Company repository."""
from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.company import Company


class CompanyRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, cid: uuid.UUID) -> Company | None:
        stmt = select(Company).where(Company.id == cid)
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> Company | None:
        stmt = select(Company).where(Company.slug == slug)
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def get_by_name(self, name: str) -> Company | None:
        stmt = select(Company).where(func.lower(Company.name) == name.lower())
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def create(self, **fields) -> Company:
        company = Company(**fields)
        self.db.add(company)
        await self.db.flush()
        return company

    async def update(self, company: Company, **fields) -> Company:
        for k, v in fields.items():
            setattr(company, k, v)
        await self.db.flush()
        return company

    async def delete(self, company: Company) -> None:
        await self.db.delete(company)
        await self.db.flush()

    async def list_paginated(
        self,
        *,
        company_type: str | None = None,
        is_newly_founded: bool | None = None,
        industry: str | None = None,
        q: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Company], int]:
        stmt = select(Company)
        count_stmt = select(func.count()).select_from(Company)

        if company_type:
            stmt = stmt.where(Company.company_type == company_type)
            count_stmt = count_stmt.where(Company.company_type == company_type)
        if is_newly_founded is not None:
            stmt = stmt.where(Company.is_newly_founded == is_newly_founded)
            count_stmt = count_stmt.where(Company.is_newly_founded == is_newly_founded)
        if industry:
            stmt = stmt.where(Company.industry == industry)
            count_stmt = count_stmt.where(Company.industry == industry)
        if q:
            pattern = f"%{q}%"
            cond = Company.name.ilike(pattern) | Company.about.ilike(pattern)
            stmt = stmt.where(cond)
            count_stmt = count_stmt.where(cond)

        total = int((await self.db.execute(count_stmt)).scalar_one())
        stmt = stmt.order_by(Company.name.asc()).offset((page - 1) * page_size).limit(page_size)
        rows = list((await self.db.execute(stmt)).scalars().all())
        return rows, total