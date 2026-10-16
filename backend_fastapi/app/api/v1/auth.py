# """Auth endpoints: register, login, token, refresh, logout, me, Google OAuth."""
# from __future__ import annotations

# import logging

# from fastapi import APIRouter, Depends, Request, Response, status
# from fastapi.responses import JSONResponse
# from fastapi.security import OAuth2PasswordRequestForm
# from sqlalchemy.ext.asyncio import AsyncSession

# from app.api.deps import CurrentUser, get_db
# from app.core.config import settings
# from app.core.exceptions import UnauthorizedError
# from app.core.rate_limit import limiter
# from app.models.enums import UserRole
# from app.schemas.auth import (
#     LoginRequest,
#     MeResponse,
#     RefreshRequest,
#     RegisterRequest,
#     RegisterResponse,
#     TokenResponse,
# )
# from app.services.auth_service import AuthService

# logger = logging.getLogger(__name__)
# router = APIRouter(prefix="/auth", tags=["auth"])


# def _client_meta(request: Request) -> tuple[str | None, str | None]:
#     ua = request.headers.get("user-agent")
#     ip = request.client.host if request.client else None
#     return ua, ip


# @router.post(
#     "/register",
#     response_model=RegisterResponse,
#     status_code=status.HTTP_201_CREATED,
#     summary="Register a new user",
# )
# @limiter.limit(settings.RATE_LIMIT_AUTH)
# async def register(
#     request: Request,
#     payload: RegisterRequest,
#     db: AsyncSession = Depends(get_db),
# ) -> RegisterResponse:
#     user = await AuthService(db).register(
#         email=payload.email,
#         password=payload.password,
#         full_name=payload.full_name,
#         role=payload.role,
#     )
#     return RegisterResponse(user_id=str(user.id))


# @router.post(
#     "/login",
#     response_model=TokenResponse,
#     summary="Login with email and password",
# )
# @limiter.limit(settings.RATE_LIMIT_AUTH)
# async def login(
#     request: Request,
#     payload: LoginRequest,
#     db: AsyncSession = Depends(get_db),
# ) -> TokenResponse:
#     ua, ip = _client_meta(request)
#     user, access, refresh, expires_in = await AuthService(db).login(
#         email=payload.email, password=payload.password, user_agent=ua, ip=ip
#     )
#     return TokenResponse(
#         access_token=access,
#         refresh_token=refresh,
#         role=UserRole(user.role),
#         expires_in=expires_in,
#     )


# @router.post(
#     "/token",
#     response_model=TokenResponse,
#     summary="OAuth2 password-flow token endpoint",
# )
# @limiter.limit(settings.RATE_LIMIT_AUTH)
# async def token(
#     request: Request,
#     form: OAuth2PasswordRequestForm = Depends(OAuth2PasswordRequestForm),
#     db: AsyncSession = Depends(get_db),
# ) -> TokenResponse:
#     ua, ip = _client_meta(request)
#     user, access, refresh, expires_in = await AuthService(db).login(
#         email=form.username, password=form.password, user_agent=ua, ip=ip
#     )
#     return TokenResponse(
#         access_token=access,
#         refresh_token=refresh,
#         role=UserRole(user.role),
#         expires_in=expires_in,
#     )


# @router.post(
#     "/refresh",
#     response_model=TokenResponse,
#     summary="Rotate refresh token",
# )
# @limiter.limit(settings.RATE_LIMIT_AUTH)
# async def refresh_token(
#     request: Request,
#     payload: RefreshRequest,
#     db: AsyncSession = Depends(get_db),
# ) -> TokenResponse:
#     ua, ip = _client_meta(request)
#     user, access, refresh, expires_in = await AuthService(db).refresh(
#         refresh_token=payload.refresh_token, user_agent=ua, ip=ip
#     )
#     return TokenResponse(
#         access_token=access,
#         refresh_token=refresh,
#         role=UserRole(user.role),
#         expires_in=expires_in,
#     )


# @router.post(
#     "/logout",
#     status_code=status.HTTP_204_NO_CONTENT,
#     response_class=Response,
#     summary="Revoke a refresh token",
# )
# async def logout(
#     payload: RefreshRequest,
#     db: AsyncSession = Depends(get_db),
# ) -> Response:
#     await AuthService(db).logout(refresh_token=payload.refresh_token)
#     return Response(status_code=status.HTTP_204_NO_CONTENT)


# @router.get("/me", response_model=MeResponse, summary="Current user identity")
# async def me(user: CurrentUser) -> MeResponse:
#     return MeResponse(
#         user_id=str(user.id), name=user.full_name, role=UserRole(user.role)
#     )


# # ---------------- Google OAuth ----------------
# @router.get("/oauth/google", summary="Start Google OAuth flow")
# async def oauth_google_start(request: Request):
#     if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
#         return JSONResponse(
#             status_code=501,
#             content={
#                 "error": {
#                     "code": "OAUTH_NOT_CONFIGURED",
#                     "message": "Google OAuth is not configured on this server.",
#                 }
#             },
#         )
#     try:
#         from authlib.integrations.starlette_client import OAuth
#     except Exception:  # noqa: BLE001
#         raise UnauthorizedError("OAuth library unavailable")

#     oauth = OAuth()
#     oauth.register(
#         name="google",
#         client_id=settings.GOOGLE_CLIENT_ID,
#         client_secret=settings.GOOGLE_CLIENT_SECRET,
#         server_metadata_url=(
#             "https://accounts.google.com/.well-known/openid-configuration"
#         ),
#         client_kwargs={"scope": "openid email profile"},
#     )
#     redirect_uri = settings.GOOGLE_REDIRECT_URI
#     return await oauth.google.authorize_redirect(request, redirect_uri)


# @router.get(
#     "/oauth/google/callback",
#     response_model=TokenResponse,
#     summary="Google OAuth callback",
# )
# async def oauth_google_callback(
#     request: Request, db: AsyncSession = Depends(get_db)
# ):
#     if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
#         return JSONResponse(
#             status_code=501,
#             content={
#                 "error": {
#                     "code": "OAUTH_NOT_CONFIGURED",
#                     "message": "Google OAuth is not configured on this server.",
#                 }
#             },
#         )
#     try:
#         from authlib.integrations.starlette_client import OAuth
#     except Exception:  # noqa: BLE001
#         raise UnauthorizedError("OAuth library unavailable")

#     oauth = OAuth()
#     oauth.register(
#         name="google",
#         client_id=settings.GOOGLE_CLIENT_ID,
#         client_secret=settings.GOOGLE_CLIENT_SECRET,
#         server_metadata_url=(
#             "https://accounts.google.com/.well-known/openid-configuration"
#         ),
#         client_kwargs={"scope": "openid email profile"},
#     )
#     token = await oauth.google.authorize_access_token(request)
#     userinfo = token.get("userinfo") or {}
#     sub = userinfo.get("sub")
#     email = userinfo.get("email")
#     name = userinfo.get("name") or (email.split("@")[0] if email else "User")
#     if not sub or not email:
#         raise UnauthorizedError("Google did not return a usable identity")
#     if not userinfo.get("email_verified", False):
#         raise UnauthorizedError("Google account email is not verified")

#     ua, ip = _client_meta(request)
#     user, access, refresh, expires_in = await AuthService(db).upsert_google_user(
#         google_sub=sub, email=email, full_name=name, user_agent=ua, ip=ip
#     )
#     return TokenResponse(
#         access_token=access,
#         refresh_token=refresh,
#         role=UserRole(user.role),
#         expires_in=expires_in,
#     )

"""Auth endpoints: register, login, token, refresh, logout, me, Google OAuth."""
# from __future__ import annotations

import logging

from fastapi import APIRouter, Body, Depends, Request, Response, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, get_db
from app.core.config import settings
from app.core.exceptions import UnauthorizedError
from app.core.rate_limit import limiter
from app.models.enums import UserRole
from app.schemas.auth import (
    LoginRequest,
    MeResponse,
    RefreshRequest,
    RegisterRequest,
    RegisterResponse,
    TokenResponse,
)
from app.services.auth_service import AuthService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


def _client_meta(request: Request) -> tuple[str | None, str | None]:
    ua = request.headers.get("user-agent")
    ip = request.client.host if request.client else None
    return ua, ip


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def register(
    request: Request,
    payload: RegisterRequest = Body(...),
    db: AsyncSession = Depends(get_db),
) -> RegisterResponse:
    user = await AuthService(db).register(
        email=payload.email,
        password=payload.password,
        full_name=payload.full_name,
        role=payload.role,
    )
    return RegisterResponse(user_id=str(user.id))


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login with email and password",
)
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def login(
    request: Request,
    payload: LoginRequest = Body(...),
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    ua, ip = _client_meta(request)
    user, access, refresh, expires_in = await AuthService(db).login(
        email=payload.email, password=payload.password, user_agent=ua, ip=ip
    )
    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        role=UserRole(user.role),
        expires_in=expires_in,
    )


@router.post(
    "/token",
    response_model=TokenResponse,
    summary="OAuth2 password-flow token endpoint",
)
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def token(
    request: Request,
    form: OAuth2PasswordRequestForm = Depends(OAuth2PasswordRequestForm),
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    ua, ip = _client_meta(request)
    user, access, refresh, expires_in = await AuthService(db).login(
        email=form.username, password=form.password, user_agent=ua, ip=ip
    )
    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        role=UserRole(user.role),
        expires_in=expires_in,
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Rotate refresh token",
)
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def refresh_token(
    request: Request,
    payload: RefreshRequest = Body(...),
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    ua, ip = _client_meta(request)
    user, access, refresh, expires_in = await AuthService(db).refresh(
        refresh_token=payload.refresh_token, user_agent=ua, ip=ip
    )
    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        role=UserRole(user.role),
        expires_in=expires_in,
    )


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Revoke a refresh token",
)
async def logout(
    payload: RefreshRequest = Body(...),
    db: AsyncSession = Depends(get_db),
) -> Response:
    await AuthService(db).logout(refresh_token=payload.refresh_token)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=MeResponse, summary="Current user identity")
async def me(user: CurrentUser) -> MeResponse:
    return MeResponse(
        user_id=str(user.id), name=user.full_name, role=UserRole(user.role)
    )


# ---------------- Google OAuth ----------------
@router.get("/oauth/google", summary="Start Google OAuth flow")
async def oauth_google_start(request: Request):
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        return JSONResponse(
            status_code=501,
            content={
                "error": {
                    "code": "OAUTH_NOT_CONFIGURED",
                    "message": "Google OAuth is not configured on this server.",
                }
            },
        )
    try:
        from authlib.integrations.starlette_client import OAuth
    except Exception:  # noqa: BLE001
        raise UnauthorizedError("OAuth library unavailable")

    oauth = OAuth()
    oauth.register(
        name="google",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        server_metadata_url=(
            "https://accounts.google.com/.well-known/openid-configuration"
        ),
        client_kwargs={"scope": "openid email profile"},
    )
    redirect_uri = settings.GOOGLE_REDIRECT_URI
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get(
    "/oauth/google/callback",
    response_model=TokenResponse,
    summary="Google OAuth callback",
)
async def oauth_google_callback(
    request: Request, db: AsyncSession = Depends(get_db)
):
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        return JSONResponse(
            status_code=501,
            content={
                "error": {
                    "code": "OAUTH_NOT_CONFIGURED",
                    "message": "Google OAuth is not configured on this server.",
                }
            },
        )
    try:
        from authlib.integrations.starlette_client import OAuth
    except Exception:  # noqa: BLE001
        raise UnauthorizedError("OAuth library unavailable")

    oauth = OAuth()
    oauth.register(
        name="google",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        server_metadata_url=(
            "https://accounts.google.com/.well-known/openid-configuration"
        ),
        client_kwargs={"scope": "openid email profile"},
    )
    token = await oauth.google.authorize_access_token(request)
    userinfo = token.get("userinfo") or {}
    sub = userinfo.get("sub")
    email = userinfo.get("email")
    name = userinfo.get("name") or (email.split("@")[0] if email else "User")
    if not sub or not email:
        raise UnauthorizedError("Google did not return a usable identity")
    if not userinfo.get("email_verified", False):
        raise UnauthorizedError("Google account email is not verified")

    ua, ip = _client_meta(request)
    user, access, refresh, expires_in = await AuthService(db).upsert_google_user(
        google_sub=sub, email=email, full_name=name, user_agent=ua, ip=ip
    )
    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        role=UserRole(user.role),
        expires_in=expires_in,
    )