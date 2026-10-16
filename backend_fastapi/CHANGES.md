# SwipeX backend — fixes applied after the read-only audit

All fixes below were verified **statically** (every file compiles, no undefined names or
missing imports, no import cycles, SQLAlchemy mappers configure, Alembic has a single linear
head and the migrations match the models). The full test suite and a live boot could **not**
be executed in the environment that produced this archive (no PostgreSQL/Redis, no network, and
the original archive's `.venv` only contained Windows binaries). Run `pytest` once locally
before relying on this build (see "How to verify").

## Blockers fixed
1. `app/api/v1/jobs.py` — `from __future__` was preceded by other imports (SyntaxError that also
   broke `companies.py` and the whole router). Imports reordered; duplicate `list_my_jobs` /
   `GET /jobs/mine` removed (the surviving `/mine` route is registered before `/{job_id}`).
2. `app/api/v1/notifications.py` — `Response` was used but never imported (NameError at import).
3. `app/services/auth_service.py` — `user.role.value` crashed for users loaded from the DB (the
   column is a plain string). Login, refresh and Google sign-in now work.
4. `app/core/rate_limit.py` — `headers_enabled=True` made every rate-limited auth route raise.
   Disabled; limiter now falls back to in-memory storage / swallows backend errors if Redis is down.

## Runtime bugs fixed
- `TrustedHostMiddleware` received CORS *URLs*; it now uses a new `ALLOWED_HOSTS` setting (hostnames).
- Swipes: previous action was read after the row was mutated, so save→apply / save→skip never
  cleaned up the saved job. Fixed; save→skip now also removes the `saved` application.
- Swipe upsert is now an atomic `INSERT ... ON CONFLICT DO UPDATE`; the applicant counter can no
  longer go below zero.
- `PATCH /companies/{id}` raised `MissingGreenlet` (expired `updated_at`); now refreshed.
- Deleting the default resume version re-promoted the deleted row; now promotes the user's most
  recent remaining version.
- `init_db` fallback called `run_until_complete` inside a running loop.
- Alerts (high match / low competition / startup / instant job) are now actually triggered: after
  job creation (background task, own DB session) and after an ATS score is stored.
- Recruiters no longer see (or act on) applicants' private `saved` bookmarks; recruiter analytics
  exclude `saved`; `resume_performance.applies` counts every non-saved application.
- The WebSocket manager now has a real Redis subscriber (multi-instance fan-out, no duplicate
  delivery, reconnect with backoff) and concurrent sends with a per-socket timeout.
- `get_storage()` no longer silently falls back to local disk when MinIO is configured but down.

## Security / hardening
- `SECRET_KEY` default or < 32 chars is rejected in staging/production.
- Seeding (`init_db --seed`, `SEED_ON_STARTUP`) is blocked in production unless `ALLOW_PRODUCTION_SEED=true`.
- Google sign-in requires `email_verified`; linking an existing local account discards its password
  and revokes its sessions (prevents pre-registration account hijacking).
- Resume upload: chunked read with size cap, magic bytes always trusted over the client content-type,
  DOCX structure verified, filenames sanitised (no quotes/CR/LF) for storage and `Content-Disposition`,
  download stream always closed.
- SMTP supports `SMTP_START_TLS` / `SMTP_USE_TLS`; the AI adapter sends `X-Internal-Api-Key`
  (`AI_SERVICE_API_KEY`).
- Dockerfile runs as a non-root user with a HEALTHCHECK; `.dockerignore` added (the old build baked
  `.env` and a Windows `.venv` into the image).
- `tests/conftest.py` forces the test DB URL and refuses to run against a database whose name does not
  contain "test" (it used to be able to `drop_all` on a dev DB).
- `alembic/env.py` escapes `%` in the DB URL and no longer swallows model import errors.
- Unused imports removed (25 statements); remaining `pass` statements are legitimate.

## New / changed settings (see `.env.example`)
`ALLOWED_HOSTS`, `AI_SERVICE_API_KEY`, `SMTP_USE_TLS`, `SMTP_START_TLS`, `ALLOW_PRODUCTION_SEED`.
`RATE_LIMIT_DEFAULT` is kept but is not enforced globally (only `RATE_LIMIT_AUTH` on auth routes).

## Known remaining items (not changed)
- Blocking I/O inside async handlers (sync `httpx` in the remote AI adapter, PDF/DOCX parsing, FCM).
- Remote AI adapter endpoint paths/payloads differ from the AI-service prompt contract (it falls back
  to the local adapter on any failure); only the auth header was added.
- Notifications are pushed over WebSocket before the DB commit (a rollback can leave a phantom push).
- WebSocket: token in query string, no Origin check / token-expiry handling / per-user limits.
- Recommendation service: candidate pool is filtered after fetch and swipe history is loaded with N+1 queries.
- Skill extraction builds one regex per dictionary key per call; very short keys (`c`, `r`, `go`) can false-match.
- No global default rate limit (add `SlowAPIMiddleware` if you want one, and mind test traffic).
- Competition thresholds default to 20/100; the data-service contract used 9/50 — pick one.
- Tests share one DB session between the test and the app, which can hide cross-session bugs.

## How to verify
```bash
docker compose -f docker-compose.dev.yml up -d postgres postgres_test redis
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
cp .env.example .env
alembic upgrade head
pytest -q
uvicorn app.main:app --reload
```
