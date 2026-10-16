"""Storage factory."""
from __future__ import annotations

import logging
from functools import lru_cache

from app.core.config import settings
from app.integrations.storage.base import StoragePort
from app.integrations.storage.local_disk import LocalDiskStorage

logger = logging.getLogger(__name__)


@lru_cache
def get_storage() -> StoragePort:
    """Return the configured storage backend.

    When ``STORAGE_BACKEND=minio`` is configured but MinIO cannot be reached, this fails
    loudly instead of silently writing resumes to ephemeral local disk. The failure is
    not cached (``lru_cache`` does not cache exceptions), so the next call retries.
    """
    if settings.STORAGE_BACKEND == "minio":
        from app.integrations.storage.minio_storage import MinioStorage

        try:
            return MinioStorage()
        except Exception as exc:
            logger.error("STORAGE_BACKEND=minio but MinIO is unavailable: %s", exc)
            raise
    return LocalDiskStorage()
