"""Auth business logic: register, login, refresh rotation, OAuth linking."""
from __future__ import annotations

from datetime import datetime, timezone

from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import ConflictError, ForbiddenError, UnauthorizedError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.models.enums import AuthProvider, UserRole
from app.models.user import User
from app.repositories.user_repo import UserRepository


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = UserRepository(db)

    # ---------- helpers ----------
    def _issue_pair(
        self, *, user: User, user_agent: str | None, ip: str | None
    ) -> tuple[str, str, int]:
        role_value = user.role.value if isinstance(user.role, UserRole) else str(user.role)
        access, _, _ = create_access_token(subject=str(user.id), role=role_value)
        refresh, jti, exp = create_refresh_token(subject=str(user.id), role=role_value)
        return access, refresh, jti, exp  # type: ignore[return-value]

    async def _persist_refresh(
        self,
        *,
        user: User,
        refresh: str,
        jti: str,
        exp: datetime,
        user_agent: str | None,
        ip: str | None,
    ) -> None:
        await self.repo.create_refresh(
            user_id=user.id,
            jti=jti,
            token_hash=hash_token(refresh),
            expires_at=exp,
            user_agent=user_agent,
            ip=ip,
        )

    # ---------- register ----------
    async def register(
        self, *, email: str, password: str, full_name: str, role: UserRole
    ) -> User:
        existing = await self.repo.get_by_email(email)
        if existing:
            raise ConflictError("Email is already registered")
        user = await self.repo.create(
            email=email,
            hashed_password=hash_password(password),
            full_name=full_name,
            role=role,
            auth_provider=AuthProvider.local,
        )
        await self.db.commit()
        return user

    # ---------- login ----------
    async def login(
        self,
        *,
        email: str,
        password: str,
        user_agent: str | None,
        ip: str | None,
    ) -> tuple[User, str, str, int]:
        user = await self.repo.get_by_email(email)
        # Constant-ish behavior: always verify, even for missing user
        ok = verify_password(password, user.hashed_password if user else None)
        if not user or not ok:
            raise UnauthorizedError("Invalid email or password")
        if not user.is_active:
            raise ForbiddenError("User account is inactive")
        if user.auth_provider == AuthProvider.google and not user.hashed_password:
            raise UnauthorizedError("Use Google sign-in for this account")

        await self.repo.update_last_login(user)
        access, refresh, jti, exp = self._issue_pair(user=user, user_agent=user_agent, ip=ip)  # type: ignore[misc]
        await self._persist_refresh(
            user=user, refresh=refresh, jti=jti, exp=exp, user_agent=user_agent, ip=ip
        )
        await self.db.commit()
        return user, access, refresh, settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    # ---------- refresh with rotation + reuse detection ----------
    async def refresh(
        self,
        *,
        refresh_token: str,
        user_agent: str | None,
        ip: str | None,
    ) -> tuple[User, str, str, int]:
        try:
            payload = decode_token(refresh_token, expected_type="refresh")
        except JWTError:
            raise UnauthorizedError("Invalid refresh token")

        jti = payload.get("jti")
        sub = payload.get("sub")
        if not jti or not sub:
            raise UnauthorizedError("Invalid refresh token")

        stored = await self.repo.get_refresh_by_jti(jti)
        if stored is None or stored.token_hash != hash_token(refresh_token):
            raise UnauthorizedError("Refresh token not recognized")

        # Reuse detection: a revoked token presented again → nuke all tokens
        if stored.revoked_at is not None:
            import uuid as _uuid

            try:
                uid = _uuid.UUID(sub)
            except ValueError:
                raise UnauthorizedError("Invalid refresh token")
            await self.repo.revoke_all_user_tokens(uid)
            await self.db.commit()
            raise UnauthorizedError("Refresh token has already been used")

        if stored.expires_at <= datetime.now(timezone.utc):
            raise UnauthorizedError("Refresh token expired")

        user = await self.repo.get_by_id(stored.user_id)
        if user is None or not user.is_active:
            raise UnauthorizedError("User no longer active")

        # Rotate
        new_access, new_refresh, new_jti, new_exp = self._issue_pair(  # type: ignore[misc]
            user=user, user_agent=user_agent, ip=ip
        )
        await self.repo.revoke_refresh(stored, replaced_by_jti=new_jti)
        await self._persist_refresh(
            user=user, refresh=new_refresh, jti=new_jti, exp=new_exp, user_agent=user_agent, ip=ip
        )
        await self.db.commit()
        return user, new_access, new_refresh, settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    # ---------- logout ----------
    async def logout(self, *, refresh_token: str) -> None:
        try:
            payload = decode_token(refresh_token, expected_type="refresh")
        except JWTError:
            return
        jti = payload.get("jti")
        if not jti:
            return
        stored = await self.repo.get_refresh_by_jti(jti)
        if stored and stored.revoked_at is None:
            await self.repo.revoke_refresh(stored)
            await self.db.commit()

    # ---------- google oauth ----------
    async def upsert_google_user(
        self,
        *,
        google_sub: str,
        email: str,
        full_name: str,
        user_agent: str | None,
        ip: str | None,
    ) -> tuple[User, str, str, int]:
        user = await self.repo.get_by_google_sub(google_sub)
        if user is None:
            user = await self.repo.get_by_email(email)
            if user is not None:
                # Link an existing local account to Google. The caller has already verified
                # that Google vouches for this email. To defeat pre-registration hijacking
                # (an attacker creating a local account with the victim's email first), the
                # local password is discarded and every existing session is revoked.
                user.google_sub = google_sub
                user.auth_provider = AuthProvider.google
                user.hashed_password = None
                await self.repo.revoke_all_user_tokens(user.id)
                await self.db.flush()
            else:
                user = await self.repo.create(
                    email=email,
                    hashed_password=None,
                    full_name=full_name,
                    role=UserRole.job_seeker,
                    auth_provider=AuthProvider.google,
                    google_sub=google_sub,
                )
        if not user.is_active:
            raise ForbiddenError("User account is inactive")
        await self.repo.update_last_login(user)
        access, refresh, jti, exp = self._issue_pair(user=user, user_agent=user_agent, ip=ip)  # type: ignore[misc]
        await self._persist_refresh(
            user=user, refresh=refresh, jti=jti, exp=exp, user_agent=user_agent, ip=ip
        )
        await self.db.commit()
        return user, access, refresh, settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    async def get_user_by_id(self, user_id) -> User | None:
        return await self.repo.get_by_id(user_id)