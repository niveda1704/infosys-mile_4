"""Local disk storage adapter (default)."""
from __future__ import annotations

import os
from pathlib import Path
from typing import BinaryIO

from app.core.config import settings


class LocalDiskStorage:
    def __init__(self, root: str | None = None) -> None:
        self.root = Path(root or settings.LOCAL_STORAGE_PATH).resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, key: str) -> Path:
        safe = key.replace("..", "_").lstrip("/")
        p = (self.root / safe).resolve()
        if not str(p).startswith(str(self.root)):
            raise ValueError("Invalid storage key")
        return p

    def save(self, key: str, data: bytes, content_type: str) -> None:
        p = self._path(key)
        p.parent.mkdir(parents=True, exist_ok=True)
        with open(p, "wb") as fh:
            fh.write(data)

    def open(self, key: str) -> BinaryIO:
        p = self._path(key)
        return open(p, "rb")

    def delete(self, key: str) -> None:
        p = self._path(key)
        if p.exists():
            os.remove(p)

    def exists(self, key: str) -> bool:
        return self._path(key).exists()