"""Milestone 4 end-to-end checks through the gateway: competition, tracking, preferences, alerts, analytics.

    python tests/e2e_milestone4.py      (stack running, jobs seeded; local .env may raise the rate limits)
"""
import os
import sys
import time
import uuid

import bcrypt
import psycopg
import requests

BASE = os.getenv("BASE", "http://127.0.0.1:5000/api/v1")
DB = os.getenv("TEST_DATABASE_URL", "postgresql://postgres:postgres@127.0.0.1:5432/swipex")
fails, passes = [], 0


def check(name, cond, detail=""):
    global passes
    if cond:
        passes += 1
        print(f"  ok   {name}")
    else:
        fails.append(name)
        print(f"  FAIL {name} {detail}")


def api(method, path, token=None, **kw):
    h = kw.pop("headers", {})
    if token:
        h["Authorization"] = f"Bearer {token}"
    return requests.request(method, BASE + path, headers=h, timeout=60, **kw)


def register(role="JOB_SEEKER", **extra):
    email = f"m4{uuid.uuid4().hex[:8]}@example.com"
    r = api("POST", "/auth/register", json={"name": "M4 " + role.title(), "email": email, "password": "Passw0rd!",
                                           "role": role, **extra})
    assert r.status_code == 201, r.text
    j = r.json()
    return j["access_token"], j["user"]["id"], email


def wait_for(fn, timeout=20):
    end = time.time() + timeout
    while time.time() < end:
        v = fn()
        if v:
            return v
        time.sleep(0.5)
    return None


rec_tok = api("POST", "/auth/login", json={"email": "demo.recruiter@swipex.dev", "password": "Recruiter@123"}).json()["access_token"]

print("== competition indicators")
jobs = api("GET", "/jobs/").json()["jobs"]
j0 = jobs[0]
need = {"applicant_count", "applicantCount", "competition_level", "competition", "posted_at", "posted_ago", "early_window_open", "is_new"}
check("job payload has competition fields", need <= set(j0), need - set(j0))
check("level is Low/Medium/High", j0["competition_level"] in ("Low", "Medium", "High"))
low = api("GET", "/jobs/?competition=Low").json()
check("competition=Low filter", low["count"] > 0 and all(j["competition_level"] == "Low" for j in low["jobs"]))
check("low_competition=true filter", api("GET", "/jobs/?low_competition=true").json()["count"] == low["count"])
check("recently_posted filter", api("GET", "/jobs/?recently_posted=true").json()["count"] > 0)

target = next(j for j in jobs if j["applicant_count"] == 0)["id"]
seekers = [register(skills=["Python"]) for _ in range(5)]
levels = []
for tok, uid, _ in seekers:
    r = api("POST", f"/jobs/{target}/swipe", tok, json={"action": "RIGHT"})
    assert r.status_code in (200, 201), r.text
    d = api("GET", f"/jobs/{target}").json()["job"]
    levels.append((d["applicant_count"], d["competition_level"]))
print("     count/level progression:", levels)
check("applicant count increments on each apply", [c for c, _ in levels] == [1, 2, 3, 4, 5])
check("level Low -> Medium at 5 applicants", levels[0][1] == "Low" and levels[-1][1] == "Medium")
mine = api("GET", f"/jobs/{target}", seekers[0][0]).json()["job"]
check("viewer sees applied + applied_early", mine["applied"] is True and mine["applied_early"] is True)
check("anonymous viewer has no applied flag", "applied" not in api("GET", f"/jobs/{target}").json()["job"])
check("saved/my-jobs carry counts", all("applicant_count" in j for j in api("GET", "/jobs/my-jobs", rec_tok).json()["jobs"]))

print("== application tracking")
tok, uid, _ = seekers[0]
apps = api("GET", "/jobs/applications", tok).json()["applications"]
app_id = apps[0]["id"]
api("PATCH", f"/jobs/applications/{app_id}", rec_tok, json={"status": "Shortlisted", "message": "Great profile"})
api("PATCH", f"/jobs/applications/{app_id}", rec_tok, json={"status": "Interview"})
h = api("GET", f"/jobs/applications/{app_id}/history", tok).json()
print("     timeline:", [(e["from_status"], e["to_status"]) for e in h["history"]])
check("timeline has Applied, Shortlisted, Interview", [e["to_status"] for e in h["history"]] == ["Applied", "Shortlisted", "Interview"])
check("recruiter note stored on the event", h["history"][1]["note"] == "Great profile")
check("history flags early applicant", h["applied_early"] is True)
check("recruiter can read history", api("GET", f"/jobs/applications/{app_id}/history", rec_tok).status_code == 200)
check("other seeker cannot read history", api("GET", f"/jobs/applications/{app_id}/history", seekers[1][0]).status_code == 404)
api("POST", f"/jobs/{jobs[3]['id']}/save", tok)
b = api("GET", "/jobs/applications/board", tok).json()
check("board has Saved + stage columns", b["stages"][0] == "Saved" and "Interview" in b["columns"])
check("board places application in Interview", any(c["application_id"] == app_id for c in b["columns"]["Interview"]))
check("board lists saved job", b["totals"]["Saved"] >= 1)

print("== alert preferences")
ptok, puid, _ = register(skills=["AWS", "Docker", "Kubernetes", "Terraform", "Linux"], desired_role="Cloud Engineer")
p = api("GET", "/notifications/preferences", ptok).json()
check("defaults: high_match + low_competition on", p["preferences"]["high_match"] and p["preferences"]["low_competition"] and not p["preferences"]["instant_job"])
check("update preferences", api("PUT", "/notifications/preferences", ptok, json={"channel_email": True, "match_threshold": 60, "quiet_start": "22:00", "quiet_end": "07:00", "tz_offset_minutes": 330}).status_code == 200)
p = api("GET", "/notifications/preferences", ptok).json()["preferences"]
check("preferences persisted", p["match_threshold"] == 60 and p["channel_email"] is True and p["quiet_start"] == "22:00")
check("bad threshold -> 400", api("PUT", "/notifications/preferences", ptok, json={"match_threshold": 150}).status_code == 400)
check("bad time -> 400", api("PUT", "/notifications/preferences", ptok, json={"quiet_start": "25:00"}).status_code == 400)
check("non-bool toggle -> 400", api("PUT", "/notifications/preferences", ptok, json={"high_match": "yes"}).status_code == 400)
itok, iuid, _ = register(skills=["Photoshop"])
api("PUT", "/notifications/preferences", itok, json={"instant_job": True, "high_match": False, "low_competition": False})
ftok, fuid, _ = register(skills=["React", "CSS", "HTML"], desired_role="Frontend Developer")

print("== alerts fire when a recruiter posts a job")
new = api("POST", "/jobs/", rec_tok, json={"title": "Kubernetes Platform Engineer", "company": "Acme Cloud",
          "description": "Run Kubernetes clusters on AWS with Terraform and Docker. CI/CD, Linux, DevOps.",
          "location": "Remote", "skills": "AWS, Docker, Kubernetes, Terraform, Linux", "salary": "10-15 LPA",
          "employment_type": "Full-time", "experience_level": "0-2 years", "work_mode": "Remote"})
check("recruiter posts job", new.status_code == 201, new.text[:200])
nid = new.json()["job"]["id"]
check("new job has competition fields (0 applicants, Low)", new.json()["job"]["applicant_count"] == 0 and new.json()["job"]["competition_level"] == "Low")


def alerts_for(token):
    ns = api("GET", "/notifications/", token).json()["notifications"]
    return [n for n in ns if n["jobId"] == nid and n["type"] in ("high_match", "low_competition", "startup", "instant_job")]


got = wait_for(lambda: alerts_for(ptok))
print("     cloud user alerts:", [(n["type"], n["title"]) for n in got or []])
check("cloud-skilled user gets a high_match alert", bool(got) and got[0]["type"] == "high_match")
check("only ONE alert per job per user", len(got or []) == 1)
check("alert links to the job", got and got[0]["link"] == f"/jobs/{nid}")
gi = wait_for(lambda: alerts_for(itok))
check("instant_job user gets an instant alert", bool(gi) and gi[0]["type"] == "instant_job")
time.sleep(1)
check("frontend-skilled user (defaults) gets no alert for a cloud job", alerts_for(ftok) == [])

print("== analytics")
sa = api("GET", "/analytics/seeker", tok).json()
check("seeker analytics shape", {"totals", "funnel", "applications_by_day", "resume_performance", "status_counts"} <= set(sa))
fun = {f["stage"]: f["count"] for f in sa["funnel"]}
check("funnel reflects Interview (reached Applied/Shortlisted/Interview)", fun["Applied"] >= 1 and fun["Shortlisted"] >= 1 and fun["Interview"] >= 1 and fun["Hired"] == 0, fun)
check("applications_by_day zero-filled to 30 days", len(sa["applications_by_day"]) >= 30 and sum(d["count"] for d in sa["applications_by_day"]) >= 1)
check("date range param", len(api("GET", "/analytics/seeker?days=7", tok).json()["applications_by_day"]) in (7, 8))
check("bad range -> 400", api("GET", "/analytics/seeker?days=9999", tok).status_code == 400)
with open(os.path.join(os.path.dirname(__file__), "..", "artificial_intelligence_meghana", "data", "resumes", "sample_resume.docx"), "rb") as fh:
    up = api("POST", "/resumes/upload", tok, files={"file": ("sample_resume.docx", fh)}).json()
api("POST", f"/jobs/{jobs[5]['id']}/swipe", tok, json={"action": "RIGHT"})
rp = api("GET", "/analytics/seeker", tok).json()["resume_performance"]
check("resume performance per version", any(r["resume_id"] == up["resume"]["id"] and r["applications"] >= 1 for r in rp), rp)

ra = api("GET", "/analytics/recruiter", rec_tok).json()
check("recruiter analytics: per-job applicants + funnel", ra["totals"]["applicants"] >= 5 and any(j["job_id"] == target and j["applicants"] >= 5 for j in ra["applicants_per_job"]))
check("recruiter analytics: skills of applicants", isinstance(ra["top_applicant_skills"], list))
check("seeker cannot read recruiter analytics", api("GET", "/analytics/recruiter", tok).status_code == 403)
check("recruiter cannot read admin analytics", api("GET", "/analytics/admin", rec_tok).status_code == 403)

admin_email = "m4admin@example.com"
with psycopg.connect(DB) as con:
    con.execute("INSERT INTO users (name,email,password_hash,role,auth_provider,skills,profile_completion) "
                "VALUES ('M4 Admin',%s,%s,'ADMIN','local','[]'::json,0) ON CONFLICT (email) DO NOTHING",
                (admin_email, bcrypt.hashpw(b"Passw0rd!", bcrypt.gensalt()).decode()))
atok = api("POST", "/auth/login", json={"email": admin_email, "password": "Passw0rd!"}).json()["access_token"]
ad = api("GET", "/analytics/admin", atok)
check("admin analytics 200", ad.status_code == 200, ad.text[:200])
ad = ad.json()
check("admin totals + users by role", ad["totals"]["users"] > 5 and "JOB_SEEKER" in ad["users_by_role"] and ad["totals"]["applications"] >= 5)
check("admin: top skills + startup vs MNC", len(ad["top_skills"]) > 0 and {c["type"] for c in ad["company_type_activity"]} & {"Startup", "MNC"})
tr = api("GET", "/analytics/trends?days=14", tok).json()
check("trends: jobs/day, skills, company types", len(tr["jobs_posted_by_day"]) >= 14 and tr["top_skills"] and tr["company_type_activity"])
check("trends date window from/to", api("GET", "/analytics/trends?from=2026-01-01&to=2026-12-31", tok).status_code == 200)

print("== AI insights")
sg = api("GET", "/ai/insights/skill-gap", ptok).json()
print("     skill gap:", sg.get("learn_next"), "coverage", sg.get("coverage"))
check("skill-gap for a new profile-only user", sg["has_signal"] and "gaps" in sg and sg["coverage"] is not None)
check("gap excludes skills the user has", not {"AWS", "Docker", "Kubernetes"} & {g["skill"] for g in sg["gaps"]})
sg0 = api("GET", "/ai/insights/skill-gap", register()[0]).json()
check("skill-gap with no signal is a friendly empty state", sg0["has_signal"] is False and sg0["gaps"] == [])
ri = api("GET", "/ai/insights/recommendations", tok).json()
check("recommendation insights shape", {"swipes", "interests", "notes", "top_recommendations", "model"} <= set(ri))
check("insights count swipes", ri["swipes"]["liked"] >= 1)

print("== security headers")
r = requests.get(BASE + "/health")
check("secure headers set", r.headers.get("X-Content-Type-Options") == "nosniff" and r.headers.get("X-Frame-Options") == "DENY")

print(f"\n{passes} passed, {len(fails)} failed")
if fails:
    print("FAILED:", fails)
    sys.exit(1)
