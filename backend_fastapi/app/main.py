"""FastAPI application factory for SwipeX backend."""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, ORJSONResponse
from slowapi.errors import RateLimitExceeded

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import RateLimitedError, register_exception_handlers
from app.core.logging import configure_logging, get_logger
from app.core.middleware import register_middleware
from app.core.rate_limit import limiter
from app.realtime.connection_manager import connection_manager

logger = get_logger("app.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging("DEBUG" if settings.DEBUG else "INFO")
    logger.info("Starting %s in %s mode", settings.APP_NAME, settings.ENVIRONMENT)
    await connection_manager.startup()
    if settings.SEED_ON_STARTUP:
        try:
            from scripts.seed_data import seed_all

            await seed_all()
            logger.info("Seed on startup complete")
        except Exception as exc:  # noqa: BLE001
            logger.warning("Seed on startup skipped: %s", exc)
    yield
    await connection_manager.shutdown()
    logger.info("Shutting down %s", settings.APP_NAME)


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version="0.1.0",
        default_response_class=ORJSONResponse,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    app.state.limiter = limiter

    @app.exception_handler(RateLimitExceeded)
    async def _rate_limit_handler(request: Request, exc: RateLimitExceeded):
        rid = getattr(request.state, "request_id", None)
        err = RateLimitedError()
        body: dict = {"error": {"code": err.code, "message": err.message}}
        if rid:
            body["error"]["request_id"] = rid
        return JSONResponse(status_code=err.status_code, content=body)

    register_exception_handlers(app)
    register_middleware(app)
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    @app.get("/", tags=["root"], summary="Root")
    async def root():
        return {"name": settings.APP_NAME, "environment": settings.ENVIRONMENT}

    return app


app = create_app()