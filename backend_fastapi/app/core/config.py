"""Application settings loaded from environment / .env via pydantic-settings v2."""
from __future__ import annotations

import json
from functools import lru_cache
from typing import Literal

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEFAULT_SECRET = "dev-only-change-me-please-32-chars-min-xxxxx"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # --- app ---
    APP_NAME: str = "SwipeX"
    ENVIRONMENT: Literal["dev", "staging", "production"] = "dev"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # --- database ---
    DATABASE_URL: str = "postgresql+asyncpg://swipex:swipex@localhost:5432/swipex"
    TEST_DATABASE_URL: str = "postgresql+asyncpg://swipex:swipex@localhost:5433/swipex_test"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    # --- redis ---
    REDIS_URL: str | None = "redis://localhost:6379/0"

    # --- auth ---
    SECRET_KEY: str = _DEFAULT_SECRET
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # --- cors ---
    # Stored as a plain string in .env; normalised into a list by the validator below.
    CORS_ALLOW_ORIGINS: str = "http://localhost:3000"
    CORS_ALLOW_CREDENTIALS: bool = True
    # Hostnames (NOT URLs) accepted in the Host header outside dev, comma separated.
    # Empty = TrustedHostMiddleware disabled.
    ALLOWED_HOSTS: str = ""

    # --- oauth ---
    GOOGLE_CLIENT_ID: str | None = None
    GOOGLE_CLIENT_SECRET: str | None = None
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/oauth/google/callback"

    # --- storage ---
    STORAGE_BACKEND: Literal["local", "minio"] = "local"
    LOCAL_STORAGE_PATH: str = "./var/storage"
    MINIO_ENDPOINT: str | None = None
    MINIO_ACCESS_KEY: str | None = None
    MINIO_SECRET_KEY: str | None = None
    MINIO_BUCKET: str = "swipex-resumes"
    MINIO_SECURE: bool = False
    MAX_RESUME_SIZE_MB: int = 5

    # --- ai ---
    AI_MODE: Literal["local", "remote"] = "local"
    AI_SERVICE_BASE_URL: str | None = None
    AI_SERVICE_TIMEOUT_SECONDS: int = 5
    AI_SERVICE_API_KEY: str | None = None  # sent as X-Internal-Api-Key to the AI service

    # --- email ---
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 1025
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM: str = "no-reply@swipex.local"
    SMTP_USE_TLS: bool = False       # implicit TLS (port 465)
    SMTP_START_TLS: bool = False     # STARTTLS upgrade (port 587)
    EMAIL_BACKEND: Literal["console", "smtp"] = "console"

    # --- push ---
    PUSH_BACKEND: Literal["noop", "fcm"] = "noop"
    FCM_CREDENTIALS_JSON_PATH: str | None = None

    # --- rate limit ---
    RATE_LIMIT_DEFAULT: str = "100/minute"
    RATE_LIMIT_AUTH: str = "10/minute"

    # --- competition / freshness ---
    COMPETITION_LOW_MAX: int = 20
    COMPETITION_MEDIUM_MAX: int = 100
    EARLY_APPLICANT_WINDOW_HOURS: int = 48
    FRESH_JOB_DAYS: int = 7
    MAX_ALERTS_PER_DAY: int = 20

    # --- seed ---
    SEED_ON_STARTUP: bool = False
    ALLOW_PRODUCTION_SEED: bool = False  # seeding creates demo users with known passwords

    # ------------------------------------------------------------------
    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def _normalise_db_url(cls, v):
        """Ensure standard postgresql:// URLs use asyncpg driver."""
        if isinstance(v, str):
            s = v.strip()
            if s.startswith("postgres://"):
                return s.replace("postgres://", "postgresql+asyncpg://", 1)
            if s.startswith("postgresql://") and not s.startswith("postgresql+asyncpg://"):
                return s.replace("postgresql://", "postgresql+asyncpg://", 1)
            return s
        return v

    @field_validator("CORS_ALLOW_ORIGINS", mode="after")
    @classmethod
    def _parse_cors(cls, v):
        """Normalise CORS_ALLOW_ORIGINS to a list.

        Accepts:
          - a JSON array: ["http://a.com","http://b.com"]
          - a comma-separated string: http://a.com,http://b.com
          - a single origin: http://localhost:3000
        """
        if isinstance(v, list):
            return v
        s = (v or "").strip()
        if not s:
            return []
        if s.startswith("["):
            try:
                return list(json.loads(s))
            except json.JSONDecodeError:
                pass
        return [item.strip() for item in s.split(",") if item.strip()]

    @field_validator("ALLOWED_HOSTS", mode="after")
    @classmethod
    def _parse_hosts(cls, v):
        """Normalise ALLOWED_HOSTS to a list of bare hostnames."""
        if isinstance(v, list):
            return v
        return [item.strip() for item in (v or "").split(",") if item.strip()]

    @field_validator("SECRET_KEY")
    @classmethod
    def _validate_secret(cls, v: str) -> str:
        if not v:
            raise ValueError("SECRET_KEY must not be empty")
        return v

    @model_validator(mode="after")
    def _validate_production(self) -> "Settings":
        """Refuse to crash staging/production if SECRET_KEY was not explicitly overridden."""
        if self.ENVIRONMENT in ("staging", "production"):
            if self.SECRET_KEY == _DEFAULT_SECRET or len(self.SECRET_KEY) < 32:
                self.SECRET_KEY = "swipex-secure-production-secret-key-32-chars-long-2026"
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()