"""CORS, security headers, request-id, and trusted-host middleware wiring."""
from __future__ import annotations

import logging
import uuid

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import settings

logger = logging.getLogger(__name__)


async def request_id_middleware(request: Request, call_next) -> Response:
    rid = request.headers.get("X-Request-ID") or uuid.uuid4().hex
    request.state.request_id = rid
    response: Response = await call_next(request)
    response.headers["X-Request-ID"] = rid
    return response


async def security_headers_middleware(request: Request, call_next) -> Response:
    response: Response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    response.headers.setdefault(
        "Permissions-Policy",
        "geolocation=(), microphone=(), camera=()",
    )
    if settings.ENVIRONMENT != "dev":
        response.headers.setdefault(
            "Strict-Transport-Security", "max-age=31536000; includeSubDomains"
        )
    # CSP: strict for API; relaxed for /docs, /redoc, /openapi.json in dev
    path = request.url.path
    if settings.ENVIRONMENT == "dev" and (
        path.startswith("/docs")
        or path.startswith("/redoc")
        or path.startswith("/openapi")
    ):
        csp = (
            "default-src 'self' https://cdn.jsdelivr.net "
            "'unsafe-inline' 'unsafe-eval' data:"
        )
    else:
        csp = "default-src 'none'"
    response.headers.setdefault("Content-Security-Policy", csp)
    return response


def register_middleware(app: FastAPI) -> None:
    # Order matters: outermost added last.
    if settings.ENVIRONMENT != "dev" and settings.ALLOWED_HOSTS:
        # Host-header validation (hostnames only, never URLs) in non-dev.
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=settings.ALLOWED_HOSTS,
        )

    app.middleware("http")(security_headers_middleware)
    app.middleware("http")(request_id_middleware)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=600,
    )