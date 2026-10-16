# SwipeX AI: recommendations, ATS and insights

The AI service (`artificial_intelligence_meghana/`, FastAPI, port 8000) reads the **same Postgres** as the other services and is reached only through the gateway (`/api/v1/ai/*`; the gateway checks the JWT and injects `user_id`).

## 1. Vectors
- **Job vector**: embedding of title + description + skills (`embeddings.py`). Cached in `ai_job_embeddings`, keyed by text hash and backend name, so editing a job re-embeds it and switching model never mixes spaces.
- **Backends**: `sentence-transformers/all-MiniLM-L6-v2` when available; otherwise a built-in hashing + skill-concept embedder (offline, no download). `/health` shows the active one. `EMBEDDING_FORCE_FALLBACK=1` forces the fallback.
- **User vector** = profile text (skills, desired role, bio - available right after sign-up, **no resume needed**) + resume text if uploaded + two swipe centroids: liked jobs (right swipe) pull the vector toward them, skipped jobs (left swipe) push it away. Swipes are weighted by recency (`0.92^age`).

## 2. Two scoring modes (same endpoint, `?mode=`)
| Mode | How |
|---|---|
| `heuristic` | Skill overlap (with synonyms/concepts), role/title match, experience level, location/work-mode. Explainable, works on day one. |
| `ml` | Cosine similarity user-vector vs job-vector, plus a logistic regression trained on the user's own swipes once there are >= 2 liked and >= 2 skipped jobs. |
| `hybrid` (default) | 0.4 heuristic + 0.6 ML. Cold start (no swipes) falls back to profile similarity and never returns 404. |
The deck is re-ranked after each swipe and diversified with MMR so it is not ten near-identical roles. Right swipe = apply, left = skip; *save* is separate and is **not** a like signal.

## 3. ATS scoring
`/resume/{ref}/ats-score`: 60 % heuristic checks (sections, contact info, skills coverage, length, action verbs) + 40 % semantic similarity to the target role/jobs. `/resume/{ref}/analysis` returns strengths, missing skills and suggestions. Resume ownership is enforced.

## 4. Recruiter side
`POST /match/candidates` scores applicants against a job; recruiters see match %, matching and missing skills next to each applicant.

## 5. Insights (Milestone 4)
- `GET /insights/skill-gap`: weights the user's target jobs (liked jobs, or top matches when there are no swipes), counts the skills they ask for, and returns the most demanded skills the user lacks (`gaps`, `learn_next`), skills they have (`strengths`) and `coverage` %.
- `GET /insights/recommendations`: swipe summary, role-family interests (liked minus skipped), why top jobs match, and plain-language notes.

## 6. Honest limitations
- The neural model was **not** run in the authoring sandbox (no access to Hugging Face); every test used the fallback embedder. Quality numbers for MiniLM are therefore untested here.
- The per-user classifier is tiny (a user's own swipes) - it personalises ranking, it is not a general model. There is no offline accuracy benchmark.
- Skill extraction is dictionary + synonym based; unknown skills are ignored.
