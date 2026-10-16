"""User + profile service (RBAC-aware)."""
from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.user import PortfolioItem, ProfileExperience, User, UserProfile
from app.repositories.user_repo import UserRepository
from app.schemas.user import (
    ExperienceCreate,
    ExperienceUpdate,
    PortfolioCreate,
    PortfolioUpdate,
    ProfileCreate,
    ProfileUpdate,
    UserUpdate,
)


class UserService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = UserRepository(db)

    # ---- user ----
    async def get_me(self, user: User) -> User:
        return user

    async def update_me(self, user: User, payload: UserUpdate) -> User:
        fields = payload.model_dump(exclude_unset=True)
        if fields:
            await self.repo.update_user(user, **fields)
            await self.db.commit()
        return user

    # ---- profile ----
    async def get_or_create_profile(self, user: User) -> UserProfile:
        prof = await self.repo.get_profile(user.id)
        if prof is not None:
            return prof
        prof = await self.repo.ensure_profile(user.id)
        await self.db.commit()
        prof = await self.repo.get_profile(user.id)
        assert prof is not None
        return prof

    async def upsert_profile(self, user: User, payload: ProfileCreate | ProfileUpdate) -> UserProfile:
        prof = await self.repo.get_profile(user.id)
        if prof is None:
            prof = await self.repo.ensure_profile(user.id)
        fields = payload.model_dump(exclude_unset=True)
        for k, v in fields.items():
            setattr(prof, k, v)
        await self.db.commit()
        refreshed = await self.repo.get_profile(user.id)
        assert refreshed is not None
        return refreshed

    # ---- experiences ----
    async def add_experience(self, user: User, payload: ExperienceCreate) -> ProfileExperience:
        prof = await self.get_or_create_profile(user)
        exp = await self.repo.add_experience(prof.id, **payload.model_dump())
        await self.db.commit()
        return exp

    async def update_experience(
        self, user: User, exp_id: uuid.UUID, payload: ExperienceUpdate
    ) -> ProfileExperience:
        prof = await self.get_or_create_profile(user)
        exp = await self.repo.get_experience(prof.id, exp_id)
        if exp is None:
            raise NotFoundError("Experience not found")
        for k, v in payload.model_dump(exclude_unset=True).items():
            setattr(exp, k, v)
        await self.db.commit()
        return exp

    async def delete_experience(self, user: User, exp_id: uuid.UUID) -> None:
        prof = await self.get_or_create_profile(user)
        exp = await self.repo.get_experience(prof.id, exp_id)
        if exp is None:
            raise NotFoundError("Experience not found")
        await self.repo.delete_experience(exp)
        await self.db.commit()

    # ---- portfolio ----
    async def add_portfolio(self, user: User, payload: PortfolioCreate) -> PortfolioItem:
        prof = await self.get_or_create_profile(user)
        item = await self.repo.add_portfolio(prof.id, **payload.model_dump())
        await self.db.commit()
        return item

    async def update_portfolio(
        self, user: User, item_id: uuid.UUID, payload: PortfolioUpdate
    ) -> PortfolioItem:
        prof = await self.get_or_create_profile(user)
        item = await self.repo.get_portfolio(prof.id, item_id)
        if item is None:
            raise NotFoundError("Portfolio item not found")
        for k, v in payload.model_dump(exclude_unset=True).items():
            setattr(item, k, v)
        await self.db.commit()
        return item

    async def delete_portfolio(self, user: User, item_id: uuid.UUID) -> None:
        prof = await self.get_or_create_profile(user)
        item = await self.repo.get_portfolio(prof.id, item_id)
        if item is None:
            raise NotFoundError("Portfolio item not found")
        await self.repo.delete_portfolio(item)
        await self.db.commit()