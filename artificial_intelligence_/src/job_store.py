"""Read access to the shared Postgres: jobs, users, swipes, saved jobs, applications, resumes.

Plus the AI-owned `ai_resumes` table. Nothing here touches SQLite or CSV files.
"""
import json
import re
import uuid

from src import db
from src.skills import canonical

# How strongly each recorded action says "I like this" (+) or "not for me" (-)
ACTION_WEIGHT = {"APPLY": 1.0, "SAVE": 0.7, "RIGHT": 0.8, "LIKE": 0.8,
                 "SKIP": -0.6, "LEFT": -0.6, "DISLIKE": -0.6}


def split_skills(value):
    """'Python, SQL' / '["Python","SQL"]' / ['Python'] -> ['Python', 'SQL']"""
    if not value:
        return []
    if isinstance(value, (list, tuple)):
        items = value
    else:
        text = str(value).strip()
        try:
            parsed = json.loads(text)
            items = parsed if isinstance(parsed, list) else [text]
        except ValueError:
            items = re.split(r"[,;|]", text.strip("[]"))
    out, seen = [], set()
    for s in items:
        s = str(s).strip().strip("'\"")
        if s and s.lower() not in seen:
            seen.add(s.lower())
            out.append(s)
    return out


def years_from(text):
    """'3 years' / '2-4 yrs' / 3 -> first number as float, else None (fresher -> 0)."""
    if text is None or text == "":
        return None
    if isinstance(text, (int, float)):
        return float(text)
    s = str(text).lower()
    nums = re.findall(r"\d+(?:\.\d+)?", s)
    if nums:
        return float(nums[0])
    if any(w in s for w in ("fresher", "entry", "intern", "student", "no experience")):
        return 0.0
    return None


def _job(r):
    loc = str(r.get("location") or "")
    mode = str(r.get("work_mode") or "")
    return {
        "id": r["id"],
        "title": r.get("title") or "",
        "company": r.get("company") or "",
        "location": loc,
        "skills": split_skills(r.get("skills")),
        "description": r.get("description") or "",
        "qualifications": r.get("qualifications") or "",
        "experience": r.get("experience_level") or "",
        "job_type": r.get("employment_type") or "",
        "work_mode": mode,
        "salary": r.get("salary") or "",
        "remote": "remote" in (mode + " " + loc).lower(),
        "created_at": r["created_at"].isoformat() if r.get("created_at") else None,
        "recruiter_id": r.get("recruiter_id"),
    }


_JOB_COLS = ("id, recruiter_id, title, company, description, location, skills, salary, employment_type, "
             "experience_level, work_mode, qualifications, status, created_at")


def load_jobs():
    """Active jobs."""
    rows = db.query(f"SELECT {_JOB_COLS} FROM jobs WHERE lower(coalesce(status,'Active')) = 'active' ORDER BY id")
    return [_job(r) for r in rows]


def load_job(job_id):
    try:
        jid = int(re.sub(r"\D", "", str(job_id)) or "x")
    except ValueError:
        return None
    rows = db.query(f"SELECT {_JOB_COLS} FROM jobs WHERE id = %s", (jid,))
    return _job(rows[0]) if rows else None


def jobs_fingerprint():
    """Cheap change detector for caches: row count + newest update + max id."""
    rows = db.query("SELECT count(*) AS n, max(updated_at) AS u, max(id) AS m FROM jobs")
    r = rows[0] if rows else {}
    return (r.get("n"), str(r.get("u")), r.get("m"))


def popularity():
    """{job_id: number of applications} used for cold-start ranking."""
    return {r["job_id"]: r["n"] for r in
            db.query("SELECT job_id, count(*) AS n FROM applications GROUP BY job_id")}


# ---------------------------------------------------------------- users / swipes
def load_user(user_id):
    try:
        uid = int(user_id)
    except (TypeError, ValueError):
        return None
    rows = db.query("SELECT id, name, skills, desired_role, experience, location, bio, role "
                    "FROM users WHERE id = %s", (uid,))
    if not rows:
        return None
    u = rows[0]
    return {
        "id": u["id"], "name": u["name"], "role": u["role"],
        "skills": [canonical(s) for s in split_skills(u["skills"])],
        "desired_role": u["desired_role"] or "",
        "experience_years": years_from(u["experience"]),
        "location": u["location"] or "",
        "bio": u["bio"] or "",
    }


def load_swipe_events(user_id):
    """-> {job_id: {"w": weight in [-1,1], "age": swipes newer than this one}}.

    Sources: swipes (RIGHT/LEFT), saved_jobs (SAVE), applications (APPLY). The age drives recency decay.
    """
    try:
        uid = int(user_id)
    except (TypeError, ValueError):
        return {}
    swipes = db.query("SELECT id, job_id, action FROM swipes WHERE user_id = %s ORDER BY id DESC", (uid,))
    agg, age = {}, {}
    for i, r in enumerate(swipes):  # newest first
        agg[r["job_id"]] = agg.get(r["job_id"], 0.0) + ACTION_WEIGHT.get(str(r["action"]).upper(), 0.0)
        age.setdefault(r["job_id"], i)
    for r in db.query("SELECT job_id FROM saved_jobs WHERE user_id = %s", (uid,)):
        agg[r["job_id"]] = agg.get(r["job_id"], 0.0) + ACTION_WEIGHT["SAVE"]
        age.setdefault(r["job_id"], 0)
    for r in db.query("SELECT job_id FROM applications WHERE user_id = %s", (uid,)):
        agg[r["job_id"]] = agg.get(r["job_id"], 0.0) + ACTION_WEIGHT["APPLY"]
        age.setdefault(r["job_id"], 0)
    return {j: {"w": max(-1.0, min(1.0, w)), "age": age.get(j, 0)} for j, w in agg.items()}


def seen_job_ids(user_id):
    """Jobs the deck should not show again: swiped (either way) or applied. Saved-only jobs stay."""
    try:
        uid = int(user_id)
    except (TypeError, ValueError):
        return set()
    ids = {r["job_id"] for r in db.query("SELECT job_id FROM swipes WHERE user_id = %s", (uid,))}
    ids |= {r["job_id"] for r in db.query("SELECT job_id FROM applications WHERE user_id = %s", (uid,))}
    return ids


# ---------------------------------------------------------------- resumes
def _resume_row(r):
    return {"skills": [canonical(s) for s in split_skills(r.get("skills") if "skills" in r else r.get("extracted_skills"))],
            "text": r.get("text") if "text" in r else (r.get("parsed_text") or ""),
            "user_id": r.get("user_id")}


def load_resume(user_id):
    """Latest resume of the user (AI store first, then the resume-service table) with skills or text."""
    try:
        uid = int(user_id)
    except (TypeError, ValueError):
        return {"skills": [], "text": ""}
    rows = db.query("SELECT user_id, skills, text, created_at FROM ai_resumes WHERE user_id = %s "
                    "ORDER BY created_at DESC LIMIT 5", (uid,))
    rows += db.query("SELECT user_id, extracted_skills, parsed_text FROM resumes WHERE user_id = %s "
                     "ORDER BY id DESC LIMIT 5", (uid,))
    for r in rows:
        res = _resume_row(r)
        if res["skills"] or (res["text"] or "").strip():
            return res
    return {"skills": [], "text": ""}


def load_resume_by_ref(ref):
    """uuid from ai_resumes, or a numeric id from the resume-service `resumes` table."""
    if ref is None or ref == "":
        return None
    ref = str(ref)
    rows = db.query("SELECT user_id, skills, text FROM ai_resumes WHERE id = %s", (ref,))
    if rows:
        return _resume_row(rows[0])
    if ref.isdigit():
        rows = db.query("SELECT user_id, extracted_skills, parsed_text FROM resumes WHERE id = %s", (int(ref),))
        if rows:
            return _resume_row(rows[0])
    return None


def save_ai_resume(user_id, skills, text, filename=None):
    rid = str(uuid.uuid4())
    uid = int(user_id) if user_id not in (None, "") and str(user_id).isdigit() else None
    db.execute("INSERT INTO ai_resumes (id, user_id, filename, skills, text) VALUES (%s,%s,%s,%s::jsonb,%s)",
               (rid, uid, filename, json.dumps(skills or []), text or ""))
    return rid


def job_skill_vocabulary():
    vocab = {}
    for r in db.query("SELECT skills FROM jobs"):
        for s in split_skills(r["skills"]):
            vocab[s.lower()] = s
    return list(vocab.values())
