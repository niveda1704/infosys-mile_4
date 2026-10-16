# SwipeX deployment runbook

Zero-cost path: Docker images built in GitHub Actions, hosted on a free tier (Render, Fly.io, Railway ...) with a free Postgres (Neon, Supabase, Render Postgres). Any host that runs Docker images and gives you HTTPS works.

## 0. Rules
- **Secrets never go into Git.** `.env` is git-ignored; only `.env.example` is committed. On the host, set variables in its dashboard; in GitHub, use *Settings -> Secrets*.
- One Postgres database is shared by all services (`DATABASE_URL`).

## 1. Run everything locally with Docker
```bash
cp .env.example .env            # set JWT_SECRET_KEY, SECRET_KEY, POSTGRES_PASSWORD
docker compose up --build       # first build downloads torch + the model: several minutes
```
- Frontend: http://localhost:8080 - API gateway: http://localhost:5000/api/v1/health
- A one-shot `tools` container creates the tables and seeds the sample jobs/companies, then exits.
- Create an admin: `docker compose exec db psql -U postgres swipex -c "UPDATE users SET role='ADMIN' WHERE email='you@example.com';"`

Without Docker: `python scripts/init_db.py && python scripts/seed_jobs.py && python scripts/run_all.py`, then `cd frontend && npm run dev`.

## 2. Services and images
| Service | Image recipe | Port | Needs |
|---|---|---|---|
| auth, job, resume, gateway | `deploy/Dockerfile.flask` (build-args `SERVICE_DIR`, `APP_MODULE`) | `$PORT` | env below |
| ai | `deploy/Dockerfile.ai` | `$PORT` (8000) | env below; ~1 GB RAM with the neural model |
| frontend | `deploy/Dockerfile.frontend` (nginx, static) | 80 | build-arg `VITE_API_BASE_URL` |
Free tiers with < 1 GB RAM: set `EMBEDDING_FORCE_FALLBACK=1` for the AI service (lexical vectors; `/health` shows it).

## 3. Environment variables (set on the host, never in Git)
Shared by every backend service: `DATABASE_URL` (`postgresql+psycopg://user:pass@host:5432/db`, add `?sslmode=require` for managed Postgres), `JWT_SECRET_KEY` (**identical everywhere**), `SECRET_KEY`.
Gateway: `AUTH_SERVICE_URL`, `JOB_SERVICE_URL`, `RESUME_SERVICE_URL`, `AI_SERVICE_URL` (internal URLs), `CORS_ORIGINS` (your frontend URL only), `TRUST_PROXY=1`, `RATE_LIMIT_*`.
Job/resume/AI: `AI_SERVICE_URL`, optionally `INTERNAL_API_KEY` (same value on gateway, job, resume, AI), `EMAIL_BACKEND=smtp` + `SMTP_*`.
Frontend (build time): `VITE_API_BASE_URL=https://<gateway-host>/api/v1`.

## 4. Typical free-tier layout (Render example)
1. Create a Postgres, copy its external URL into `DATABASE_URL`.
2. Create 5 *Web Services from a Dockerfile* (auth, job, resume, ai, gateway) - same repo, different Dockerfile path / build args from the table. Only the gateway needs a public URL; point the others' URLs into the gateway's env (use the host's private network if offered).
3. Create a *Static Site* (or the frontend image) with `VITE_API_BASE_URL` set to the gateway's HTTPS URL; put that site's URL into the gateway's `CORS_ORIGINS`.
4. Run once: `python scripts/init_db.py && python scripts/seed_jobs.py` against the production `DATABASE_URL` (from your machine, or a one-off job).
5. Each service's *Deploy Hook* URL -> a single GitHub secret `DEPLOY_HOOKS` (space-separated). The `deploy` job in `.github/workflows/ci.yml` calls them after tests and image builds pass on `main`.
Free instances sleep when idle; the first request after a pause is slow.

## 5. CI/CD (`.github/workflows/ci.yml`)
`backend` (Postgres service, unit tests, tables + seed, start the stack, both e2e suites) -> `frontend` (build) -> `images` (build every Dockerfile, no push) -> `deploy` (main only, calls `DEPLOY_HOOKS`; skipped if the secret is absent).

## 6. Post-deploy smoke checklist
1. `GET https://<gateway>/health` -> every service `ok`.
2. Sign up, swipe right on a job, see it under Applications.
3. Log in as a recruiter, move the application to *Shortlisted* -> the seeker gets a notification within ~15 s.
4. Dashboard loads charts; `/notifications/preferences` saves.
5. Response headers include `X-Content-Type-Options` and (over HTTPS) `Strict-Transport-Security`; a browser from another origin is refused by CORS.

## 7. Not verified by the author
Docker image builds and any real cloud release were not run in the authoring environment. Expect to fix small host-specific details (ports, private-network hostnames) on first deploy.
