"""Application exception hierarchy and FastAPI exception handlers."""
from __future__ import annotations

import logging
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


class AppException(Exception):
    """Base application exception carrying an HTTP status and error code."""

    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: Any | None = None,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details


class NotFoundError(AppException):
    def __init__(self, message: str = "Resource not found", details: Any | None = None) -> None:
        super().__init__(status.HTTP_404_NOT_FOUND, "NOT_FOUND", message, details)


class ConflictError(AppException):
    def __init__(self, message: str = "Resource conflict", details: Any | None = None) -> None:
        super().__init__(status.HTTP_409_CONFLICT, "CONFLICT", message, details)


class UnauthorizedError(AppException):
    def __init__(self, message: str = "Authentication required", details: Any | None = None) -> None:
        super().__init__(status.HTTP_401_UNAUTHORIZED, "UNAUTHORIZED", message, details)


class ForbiddenError(AppException):
    def __init__(self, message: str = "Forbidden", details: Any | None = None) -> None:
        super().__init__(status.HTTP_403_FORBIDDEN, "FORBIDDEN", message, details)


class ValidationFailedError(AppException):
    def __init__(self, message: str = "Validation failed", details: Any | None = None) -> None:
        super().__init__(status.HTTP_422_UNPROCESSABLE_ENTITY, "VALIDATION_FAILED", message, details)


class BadRequestError(AppException):
    def __init__(self, message: str = "Bad request", details: Any | None = None) -> None:
        super().__init__(status.HTTP_400_BAD_REQUEST, "BAD_REQUEST", message, details)


class RateLimitedError(AppException):
    def __init__(self, message: str = "Rate limit exceeded", details: Any | None = None) -> None:
        super().__init__(status.HTTP_429_TOO_MANY_REQUESTS, "RATE_LIMITED", message, details)


class ExternalServiceError(AppException):
    def __init__(self, message: str = "External service error", details: Any | None = None) -> None:
        super().__init__(status.HTTP_502_BAD_GATEWAY, "EXTERNAL_SERVICE_ERROR", message, details)


class FileTooLargeError(AppException):
    def __init__(self, message: str = "File too large", details: Any | None = None) -> None:
        super().__init__(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "FILE_TOO_LARGE", message, details)


class UnsupportedFileTypeError(AppException):
    def __init__(self, message: str = "Unsupported file type", details: Any | None = None) -> None:
        super().__init__(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "UNSUPPORTED_FILE_TYPE", message, details)


class InvalidStatusTransitionError(AppException):
    def __init__(self, message: str = "Invalid status transition", details: Any | None = None) -> None:
        super().__init__(status.HTTP_409_CONFLICT, "INVALID_STATUS_TRANSITION", message, details)


def _envelope(code: str, message: str, request_id: str | None, details: Any | None = None) -> dict:
    err: dict[str, Any] = {"code": code, "message": message}
    if details is not None:
        err["details"] = details
    if request_id:
        err["request_id"] = request_id
    return {"error": err}


def _req_id(request: Request) -> str | None:
    return getattr(request.state, "request_id", None)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppException)
    async def _app_exc(request: Request, exc: AppException) -> JSONResponse:
        rid = _req_id(request)
        logger.warning(
            "AppException",
            extra={"request_id": rid, "path": request.url.path, "status_code": exc.status_code},
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=_envelope(exc.code, exc.message, rid, exc.details),
        )

    @app.exception_handler(RequestValidationError)
    async def _validation(request: Request, exc: RequestValidationError) -> JSONResponse:
        rid = _req_id(request)
        details = [
            {"loc": list(e.get("loc", [])), "msg": e.get("msg"), "type": e.get("type")}
            for e in exc.errors()
        ]
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=_envelope("VALIDATION_FAILED", "Request validation failed", rid, details),
        )

    @app.exception_handler(StarletteHTTPException)
    async def _http(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        rid = _req_id(request)
        code_map = {
            400: "BAD_REQUEST",
            401: "UNAUTHORIZED",
            403: "FORBIDDEN",
            404: "NOT_FOUND",
            405: "METHOD_NOT_ALLOWED",
            409: "CONFLICT",
            429: "RATE_LIMITED",
        }
        code = code_map.get(exc.status_code, f"HTTP_{exc.status_code}")
        message = exc.detail if isinstance(exc.detail, str) else "HTTP error"
        headers = getattr(exc, "headers", None)
        return JSONResponse(
            status_code=exc.status_code,
            content=_envelope(code, message, rid),
            headers=headers,
        )

    @app.exception_handler(IntegrityError)
    async def _integrity(request: Request, exc: IntegrityError) -> JSONResponse:
        rid = _req_id(request)
        logger.warning("IntegrityError", extra={"request_id": rid, "path": request.url.path})
        msg = str(getattr(exc, "orig", exc))
        code = "CONFLICT"
        message = "Resource conflict (unique or integrity constraint)."
        if "unique" in msg.lower() or "duplicate" in msg.lower():
            message = "A resource with these unique fields already exists."
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content=_envelope(code, message, rid),
        )

    @app.exception_handler(Exception)
    async def _unhandled(request: Request, exc: Exception) -> JSONResponse:
        rid = _req_id(request)
        logger.exception("Unhandled error", extra={"request_id": rid, "path": request.url.path})
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=_envelope("INTERNAL_ERROR", "An internal error occurred.", rid),
        )