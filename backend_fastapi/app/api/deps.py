"""FastAPI dependencies: DB session, current user, RBAC, pagination."""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import Depends, Header, Query
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import decode_token
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.repositories.user_repo import UserRepository

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_PREFIX}/auth/token",
    auto_error=False,
)


async def get_current_user(
    db: Annotated[AsyncSession, Depends(get_db)],
    token: Annotated[str | None, Depends(oauth2_scheme)] = None,
    authorization: Annotated[str | None, Header()] = None,
) -> User:
    raw = token
    if not raw and authorization and authorization.lower().startswith("bearer "):
        raw = authorization.split(" ", 1)[1].strip()
    if not raw:
        raise UnauthorizedError("Missing bearer token")

    try:
        payload = decode_token(raw, expected_type="access")
    except JWTError:
        raise UnauthorizedError("Invalid or expired access token")

    sub = payload.get("sub")
    if not sub:
        raise UnauthorizedError("Invalid access token")
    try:
        user_id = uuid.UUID(sub)
    except ValueError:
        raise UnauthorizedError("Invalid access token subject")

    user = await UserRepository(db).get_by_id(user_id)
    if user is None or not user.is_active:
        raise UnauthorizedError("User not found or inactive")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_role(*roles: UserRole):
    allowed = {r.value if isinstance(r, UserRole) else str(r) for r in roles}

    async def _checker(user: CurrentUser) -> User:
        role_value = user.role.value if isinstance(user.role, UserRole) else str(user.role)
        if role_value not in allowed:
            raise ForbiddenError(f"Requires one of roles: {', '.join(sorted(allowed))}")
        return user

    return _checker


require_job_seeker = require_role(UserRole.job_seeker)
require_recruiter = require_role(UserRole.recruiter)
require_admin = require_role(UserRole.admin)
require_recruiter_or_admin = require_role(UserRole.recruiter, UserRole.admin)


class Pagination:
    def __init__(self, page: int = 1, page_size: int = 20) -> None:
        self.page = max(1, page)
        self.page_size = max(1, min(100, page_size))

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


def get_pagination(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> Pagination:
    return Pagination(page=page, page_size=page_size)


PaginationDep = Annotated[Pagination, Depends(get_pagination)]