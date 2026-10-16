# SwipeX - Milestone 4: Notifications, Analytics & Deployment

What was built against `SwipeX_Milestone4_SRS.pdf`, how to check it, and - just as important - what is **not** done.

Everything goes through the gateway (`/api/v1/...`) and the single shared Postgres database.

| FR | Requirement | Status | Where / how it works |
|----|-------------|--------|----------------------|
| FR-01 | In-app notifications, unread count, history | **Done** | `job-service/routes/notifications.py`; bell + `/notifications` page. *Real-time = the app polls every 15 s* (no WebSocket/Redis). New items pop a toast. |
| FR-02 | Alert types: instant job, startup hiring, high match, low competition | **Done (in-app, email)** / push **not implemented** | `alerts.py`. When a recruiter posts a job, `fan_out_new_job` scores seekers with the AI service and creates **one** alert per user per job (priority high_match > startup_hiring > low_competition > instant_job). Cap: 10 alerts/user/day. Email goes through `delivery.py` (`EMAIL_BACKEND=console` logs, `smtp` sends). Push (FCM) is only a hook. |
| FR-03 | Alert preferences: types, channels, match threshold, quiet hours | **Done** | `GET/PUT /notifications/preferences` (validated), UI at `/notifications/preferences`. Quiet hours (incl. overnight, user timezone) suppress email/push only; in-app alerts still arrive. |
| FR-04 | Application tracking + status history + recruiter updates notify | **Done** | `application_status_events` timeline (`GET /jobs/applications/<id>/history`), board (`GET /jobs/applications/board`: Saved + stages). The application card shows the real timeline. Recruiter status change -> candidate notification (Milestone 3 behaviour kept). |
| FR-05 | Job cards: posted time, applicant count, Low/Medium/High competition, early applicant, filters | **Done** | `competition.py`. Counts are computed live from `applications` (no counter to drift). **High** >= 15 applicants or >= 6/day; **Medium** >= 5 or >= 2/day; else **Low** (env-tunable `COMP_*`). Early window = first 48 h (`early_window_open`, `applied_early`). Filters: `?competition=Low` / `?low_competition=true` / `?recently_posted=true`, in the filter modal and the pill bar. |
| FR-06 | Seeker analytics: funnel, resume performance, skill gap, recommendation insights | **Done** | `GET /analytics/seeker`, `GET /ai/insights/skill-gap`, `GET /ai/insights/recommendations`; `/dashboard`. Resume performance is per resume version (applications, shortlisted+, interviews, rate). |
| FR-07 | Recruiter + admin analytics | **Done** | `GET /analytics/recruiter` (applicants per job, funnel, trend, applicant skills), `GET /analytics/admin` (totals, users by role, sign-ups, jobs/applications per day). Shown at the bottom of the recruiter and admin dashboards. |
| FR-08 | Hiring trends with date range | **Done** | `GET /analytics/trends?days=N` or `?from=&to=`: jobs posted/day, in-demand skills, startup vs MNC. A date-range selector sits on every dashboard. Startup/MNC comes from `companies.category`; jobs whose company is unknown count as "Unknown". |
| FR-09 | RBAC on new endpoints | **Done** | Seekers get 403 on recruiter analytics, recruiters on admin analytics; history is visible only to the applicant or the job's recruiter (404 otherwise). Covered by `tests/e2e_milestone4.py`. |
| FR-10 | Security: HTTPS, CORS allow-list, rate limiting, secure headers, env secrets | **Partly** | CORS allow-list (`CORS_ORIGINS`), per-IP rate limiting at the gateway (429; `RATE_LIMIT_*`), secure headers (nosniff, DENY framing, referrer, permissions policy, HSTS when the request is HTTPS), secrets only from env, `.gitignore` excludes `.env`. **HTTPS itself is terminated by your host/proxy** (Render, Fly, Caddy...), not by the app. The limiter is in-memory per gateway process, so with several gateway workers/instances limits are per instance. |
| FR-11 | Cloud deployment via CI/CD, Docker, free tier | **Prepared, not released** | `deploy/Dockerfile.*`, `docker-compose.yml`, `.github/workflows/ci.yml`, `docs/DEPLOYMENT.md`. **No live cloud release was made, and the Docker images were not built in the authoring environment** (no Docker daemon). `docker compose config` validates; the first real build happens on your machine / in CI. |
| FR-12 | End-to-end flow + docs | **Done** | `tests/e2e_gateway.py` (50 checks) + `tests/e2e_milestone4.py` (52) + `tests/test_units.py` (4) + `tests/ui_smoke.py` (browser). This file, `DEPLOYMENT.md`, `ML_AND_RECOMMENDATIONS.md`. |

## New API surface

| Method | Path | Who |
|--------|------|-----|
| GET/PUT | `/notifications/preferences` | any signed-in user |
| GET | `/jobs/applications/board` | seeker |
| GET | `/jobs/applications/<id>/history` | applicant or the job's recruiter |
| GET | `/analytics/seeker` `/recruiter` `/admin` `?days=7..365` | seeker / recruiter / admin |
| GET | `/analytics/trends` `?days=` or `?from=&to=` | any signed-in user |
| GET | `/ai/insights/skill-gap`, `/ai/insights/recommendations` | any signed-in user |
| GET | `/jobs/?competition=Low\|Medium\|High`, `?low_competition=true`, `?recently_posted=true` | public |

Job payloads gained: `applicant_count`, `competition_level`, `posted_at`, `posted_ago`, `early_window_open`, `is_new`, and for a signed-in viewer `applied`, `applied_early`.

## Known limits (be upfront with reviewers)

- **Polling, not push:** notifications appear within ~15 s. WebSocket/SSE would need a broker for more than one process.
- **Push notifications (FCM)** are not implemented - only the preference field and a "configured?" check.
- **Email** only really sends when `EMAIL_BACKEND=smtp` and SMTP credentials are set; otherwise it is logged to the console.
- **Admin accounts** cannot be created through the UI (by design); insert one with SQL: `UPDATE users SET role='ADMIN' WHERE email='you@example.com';`
- The **semantic model** (`all-MiniLM-L6-v2`) could not be downloaded in the authoring sandbox; all tests ran on the built-in hashing+concept fallback (`/health` reports which backend is active). Run once with network access to confirm the neural path.
- Rate limiting and the alert fan-out thread are per-process (fine for the free tier; use Redis/a queue if you scale out).
