"""Health and readiness endpoints."""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])


@router.get("/health", summary="Liveness probe")
async def health() -> dict:
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.ENVIRONMENT}


@router.get("/ready", summary="Readiness probe")
async def ready(db: AsyncSession = Depends(get_db)) -> dict:
    checks: dict[str, str] = {}
    ok = True

    # DB
    try:
        await db.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as exc:  # noqa: BLE001
        checks["database"] = f"error: {exc.__class__.__name__}"
        ok = False

    # Redis (optional)
    if settings.REDIS_URL:
        try:
            from redis.asyncio import Redis
            client = Redis.from_url(settings.REDIS_URL)
            await client.ping()
            await client.aclose()
            checks["redis"] = "ok"
        except Exception as exc:  # noqa: BLE001
            checks["redis"] = f"degraded: {exc.__class__.__name__}"
            # Redis is optional → don't fail readiness
    else:
        checks["redis"] = "disabled"

    # Storage
    try:
        from app.integrations.storage.factory import get_storage
        storage = get_storage()
        checks["storage"] = type(storage).__name__
    except Exception as exc:  # noqa: BLE001
        checks["storage"] = f"degraded: {exc.__class__.__name__}"

    if not ok:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=503, content={"status": "unready", "checks": checks})
    return {"status": "ready", "checks": checks}


@router.get("/system/seed", summary="Trigger seed data")
@router.post("/system/seed", summary="Trigger seed data POST")
async def trigger_seed():
    import traceback
    try:
        from scripts.seed_data import seed_all
        await seed_all()
        return {"status": "success", "message": "Database seeded successfully"}
    except Exception as exc:
        return {"status": "error", "error": str(exc), "traceback": traceback.format_exc()}