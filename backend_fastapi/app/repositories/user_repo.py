"""User + profile + refresh-token repository."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import PortfolioItem, ProfileExperience, RefreshToken, User, UserProfile


class UserRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ---- user ----
    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        stmt = select(User).where(User.id == user_id)
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        stmt = select(User).where(func.lower(User.email) == email.lower())
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def get_by_google_sub(self, sub: str) -> User | None:
        stmt = select(User).where(User.google_sub == sub)
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def create(
        self,
        *,
        email: str,
        hashed_password: str | None,
        full_name: str,
        role,
        auth_provider,
        google_sub: str | None = None,
    ) -> User:
        user = User(
            email=email.lower(),
            hashed_password=hashed_password,
            full_name=full_name,
            role=role,
            auth_provider=auth_provider,
            google_sub=google_sub,
        )
        self.db.add(user)
        await self.db.flush()
        return user

    async def update_last_login(self, user: User) -> None:
        user.last_login_at = datetime.now(timezone.utc)
        await self.db.flush()

    async def list_paginated(
        self,
        *,
        role: str | None = None,
        q: str | None = None,
        is_active: bool | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[User], int]:
        stmt = select(User)
        count_stmt = select(func.count()).select_from(User)
        if role is not None:
            stmt = stmt.where(User.role == role)
            count_stmt = count_stmt.where(User.role == role)
        if is_active is not None:
            stmt = stmt.where(User.is_active == is_active)
            count_stmt = count_stmt.where(User.is_active == is_active)
        if q:
            pattern = f"%{q}%"
            stmt = stmt.where(User.email.ilike(pattern) | User.full_name.ilike(pattern))
            count_stmt = count_stmt.where(User.email.ilike(pattern) | User.full_name.ilike(pattern))
        total = int((await self.db.execute(count_stmt)).scalar_one())
        stmt = stmt.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        rows = list((await self.db.execute(stmt)).scalars().all())
        return rows, total

    async def update_user(self, user: User, **fields) -> User:
        for key, value in fields.items():
            setattr(user, key, value)
        await self.db.flush()
        return user

    # ---- refresh tokens ----
    async def create_refresh(
        self,
        *,
        user_id: uuid.UUID,
        jti: str,
        token_hash: str,
        expires_at: datetime,
        user_agent: str | None,
        ip: str | None,
    ) -> RefreshToken:
        rt = RefreshToken(
            user_id=user_id,
            jti=jti,
            token_hash=token_hash,
            expires_at=expires_at,
            user_agent=user_agent,
            ip=ip,
        )
        self.db.add(rt)
        await self.db.flush()
        return rt

    async def get_refresh_by_jti(self, jti: str) -> RefreshToken | None:
        stmt = select(RefreshToken).where(RefreshToken.jti == jti)
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def revoke_refresh(self, token: RefreshToken, replaced_by_jti: str | None = None) -> None:
        token.revoked_at = datetime.now(timezone.utc)
        if replaced_by_jti:
            token.replaced_by_jti = replaced_by_jti
        await self.db.flush()

    async def revoke_all_user_tokens(self, user_id: uuid.UUID) -> None:
        stmt = (
            update(RefreshToken)
            .where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
            .values(revoked_at=datetime.now(timezone.utc))
        )
        await self.db.execute(stmt)

    # ---- profile ----
    async def get_profile(self, user_id: uuid.UUID) -> UserProfile | None:
        stmt = (
            select(UserProfile)
            .where(UserProfile.user_id == user_id)
            .options(
                selectinload(UserProfile.experiences),
                selectinload(UserProfile.portfolio),
            )
        )
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def ensure_profile(self, user_id: uuid.UUID) -> UserProfile:
        existing = await self.db.execute(
            select(UserProfile).where(UserProfile.user_id == user_id)
        )
        prof = existing.scalar_one_or_none()
        if prof:
            return prof
        prof = UserProfile(user_id=user_id)
        self.db.add(prof)
        await self.db.flush()
        return prof

    async def load_profile_full(self, user_id: uuid.UUID) -> UserProfile | None:
        return await self.get_profile(user_id)

    async def add_experience(self, profile_id: uuid.UUID, **fields) -> ProfileExperience:
        exp = ProfileExperience(profile_id=profile_id, **fields)
        self.db.add(exp)
        await self.db.flush()
        return exp

    async def get_experience(self, profile_id: uuid.UUID, exp_id: uuid.UUID) -> ProfileExperience | None:
        stmt = select(ProfileExperience).where(
            ProfileExperience.id == exp_id, ProfileExperience.profile_id == profile_id
        )
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def delete_experience(self, exp: ProfileExperience) -> None:
        await self.db.delete(exp)

    async def add_portfolio(self, profile_id: uuid.UUID, **fields) -> PortfolioItem:
        item = PortfolioItem(profile_id=profile_id, **fields)
        self.db.add(item)
        await self.db.flush()
        return item

    async def get_portfolio(self, profile_id: uuid.UUID, item_id: uuid.UUID) -> PortfolioItem | None:
        stmt = select(PortfolioItem).where(
            PortfolioItem.id == item_id, PortfolioItem.profile_id == profile_id
        )
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def delete_portfolio(self, item: PortfolioItem) -> None:
        await self.db.delete(item)