# SwipeX Backend

FastAPI + PostgreSQL + SQLAlchemy 2.0 backend for the SwipeX platform
(swipe-based intelligent job discovery and career assistance).

## Status

Phases 1–10 implemented: Auth/RBAC, Job/Company/Swipe/Search, Resumes/ATS/Recommendations,
Applications/Notifications (with WebSocket + Redis Pub/Sub), Analytics + Admin.
Seed data + Alembic migrations included. Phase 11 (hardening) pending.

## Quickstart (Docker Compose)

```bash
cp .env.example .env
docker compose -f docker-compose.dev.yml up --build

# Apply migrations + seed demo data
docker compose -f docker-compose.dev.yml exec backend alembic upgrade head
docker compose -f docker-compose.dev.yml exec backend python -m app.db.init_db --seed

# Docs:      http://localhost:8000/docs
# Health:    http://localhost:8000/api/v1/health
# Readiness: http://localhost:8000/api/v1/ready
# MailHog:   http://localhost:8025
# MinIO:     http://localhost:9001  (minioadmin / minioadmin)

## Release notes
See [CHANGES.md](CHANGES.md) for the fixes applied after the audit and the list of known remaining items.
