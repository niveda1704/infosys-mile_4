# SwipeX

Swipe-based job platform: React frontend -> **API gateway** -> auth / job / resume services + AI service, all on one PostgreSQL database.

```bash
cp .env.example .env                       # set secrets
python scripts/init_db.py && python scripts/seed_jobs.py
python scripts/run_all.py                  # gateway :5000, auth 5001, job 5002, resume 5003, AI 8000
cd frontend && cp .env.example .env && npm install && npm run dev   # http://localhost:5173
```
Demo recruiter after seeding: `demo.recruiter@swipex.dev` / `Recruiter@123`.
Docker: `docker compose up --build` (see `docs/DEPLOYMENT.md`).

Tests (stack running): `python tests/e2e_gateway.py`, `python tests/e2e_milestone4.py`; unit: `pytest tests/test_units.py`.
Docs: `docs/MILESTONE4.md`, `docs/DEPLOYMENT.md`, `docs/ML_AND_RECOMMENDATIONS.md`.
