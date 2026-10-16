"""MinIO storage adapter (optional)."""
from __future__ import annotations

import io
from typing import BinaryIO

from app.core.config import settings


class MinioStorage:
    def __init__(self) -> None:
        # Imported lazily so the package is optional at boot time.
        from minio import Minio

        if not settings.MINIO_ENDPOINT or not settings.MINIO_ACCESS_KEY or not settings.MINIO_SECRET_KEY:
            raise RuntimeError("MinIO credentials are not configured")
        self._client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
        self._bucket = settings.MINIO_BUCKET
        if not self._client.bucket_exists(self._bucket):
            self._client.make_bucket(self._bucket)

    def save(self, key: str, data: bytes, content_type: str) -> None:
        self._client.put_object(
            self._bucket, key, io.BytesIO(data), length=len(data), content_type=content_type
        )

    def open(self, key: str) -> BinaryIO:
        resp = self._client.get_object(self._bucket, key)
        return resp  # type: ignore[return-value]

    def delete(self, key: str) -> None:
        self._client.remove_object(self._bucket, key)

    def exists(self, key: str) -> bool:
        try:
            self._client.stat_object(self._bucket, key)
            return True
        except Exception:  # noqa: BLE001
            return False