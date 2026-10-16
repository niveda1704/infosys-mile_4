"""Company service — business logic with ownership checks."""
from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.models.company import Company
from app.models.enums import UserRole
from app.models.user import User
from app.repositories.company_repo import CompanyRepository
from app.schemas.company import CompanyCreate, CompanyUpdate
from app.utils.slugify import slugify


class CompanyService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = CompanyRepository(db)

    async def get(self, cid: uuid.UUID) -> Company:
        company = await self.repo.get_by_id(cid)
        if company is None:
            raise NotFoundError("Company not found")
        return company

    async def get_by_slug(self, slug: str) -> Company:
        company = await self.repo.get_by_slug(slug)
        if company is None:
            raise NotFoundError("Company not found")
        return company

    async def list(
        self,
        *,
        company_type: str | None = None,
        is_newly_founded: bool | None = None,
        industry: str | None = None,
        q: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Company], int]:
        return await self.repo.list_paginated(
            company_type=company_type,
            is_newly_founded=is_newly_founded,
            industry=industry,
            q=q,
            page=page,
            page_size=page_size,
        )

    async def create(self, user: User, payload: CompanyCreate) -> Company:
        existing = await self.repo.get_by_name(payload.name)
        if existing is not None:
            raise ConflictError("A company with this name already exists")
        base_slug = slugify(payload.name)
        slug = base_slug
        counter = 1
        while await self.repo.get_by_slug(slug):
            counter += 1
            slug = f"{base_slug}-{counter}"
        company = await self.repo.create(
            owner_user_id=user.id,
            slug=slug,
            **payload.model_dump(),
        )
        await self.db.commit()
        return company

    async def update(self, user: User, cid: uuid.UUID, payload: CompanyUpdate) -> Company:
        company = await self.repo.get_by_id(cid)
        if company is None:
            raise NotFoundError("Company not found")
        if user.role != UserRole.admin.value and company.owner_user_id != user.id:
            raise ForbiddenError("You do not own this company")
        fields = payload.model_dump(exclude_unset=True)
        if "name" in fields and fields["name"] != company.name:
            # Re-slug if the name changed
            fields.setdefault("slug", slugify(fields["name"]))
            if await self.repo.get_by_slug(fields["slug"]):
                raise ConflictError("Slug collision")
        company = await self.repo.update(company, **fields)
        await self.db.commit()
        # updated_at is a server-side onupdate column and is expired after the UPDATE;
        # refresh it so the async response serializer never triggers a lazy load.
        await self.db.refresh(company)
        return company

    async def delete(self, user: User, cid: uuid.UUID) -> None:
        if user.role != UserRole.admin.value:
            raise ForbiddenError("Only admins may delete companies")
        company = await self.repo.get_by_id(cid)
        if company is None:
            raise NotFoundError("Company not found")
        await self.repo.delete(company)
        await self.db.commit()