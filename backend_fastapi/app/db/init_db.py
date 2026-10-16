"""CLI: create extensions, run alembic upgrade head, and optionally seed."""
from __future__ import annotations

import argparse
import asyncio
import logging
import subprocess
import sys

from sqlalchemy import text

from app.core.config import settings
from app.core.logging import configure_logging
from app.db.session import engine

logger = logging.getLogger("app.db.init_db")


async def _create_extensions() -> None:
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pgcrypto"))
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
    logger.info("Extensions pgcrypto + pg_trgm ensured")


async def _run_alembic_upgrade() -> None:
    logger.info("Running alembic upgrade head")
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        # Fallback to create_all (dev only)
        logger.warning("alembic upgrade failed (%s); falling back to create_all", result.returncode)
        logger.warning("alembic stderr: %s", result.stderr.strip())
        await _create_all()
    else:
        logger.info("Alembic upgrade head succeeded")


async def _create_all() -> None:
    from app.db.base import Base
    # Import models so they register with Base.metadata
    from app import models  # noqa: F401
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("create_all completed")


async def _reset() -> None:
    if settings.ENVIRONMENT == "production":
        raise RuntimeError("--reset is blocked in production.")
    from app.db.base import Base
    from app import models  # noqa: F401
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    logger.info("All tables dropped")


async def _seed() -> None:
    try:
        from scripts.seed_data import seed_all
    except Exception as exc:  # noqa: BLE001
        logger.warning("Seed module not available yet: %s", exc)
        return
    await seed_all()
    logger.info("Seed completed")


async def main_async(reset: bool, seed: bool) -> None:
    await _create_extensions()
    if reset:
        await _reset()
    await _run_alembic_upgrade()
    if seed:
        await _seed()
    await engine.dispose()


def main() -> None:
    configure_logging("INFO" if not settings.DEBUG else "DEBUG")
    parser = argparse.ArgumentParser(description="Initialize SwipeX database.")
    parser.add_argument("--reset", action="store_true", help="Drop and recreate all tables.")
    parser.add_argument("--seed", action="store_true", help="Seed demo data idempotently.")
    args = parser.parse_args()
    asyncio.run(main_async(reset=args.reset, seed=args.seed))


if __name__ == "__main__":
    main()