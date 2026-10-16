"""End-to-end check through the GATEWAY only (needs `python scripts/run_all.py` running and seeded jobs).

    python tests/e2e_gateway.py            # BASE defaults to http://127.0.0.1:5000/api/v1
"""
import os
import sys
import time
import uuid

import requests

BASE = os.getenv("BASE", "http://127.0.0.1:5000/api/v1")
DOCX = os.path.join(os.path.dirname(__file__), "..", "artificial_intelligence_meghana", "data", "resumes", "sample_resume.docx")
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


def register(role="JOB_SEEKER", skills=None, **extra):
    email = f"t{uuid.uuid4().hex[:8]}@example.com"
    body = {"name": "Test " + role, "email": email, "password": "Passw0rd!", "role": role, **extra}
    if skills is not None:
        body["skills"] = skills
    r = api("POST", "/auth/register", json=body)
    return r, email


def fam(job):
    t = job["title"].lower() + " "
    for k, names in {"ml": ["machine learning", "data scientist", "ai ", "nlp", "ml", "deep learning", "computer vision", "genai"],
                     "cloud": ["cloud", "devops", "sre", "infrastructure", "platform"],
                     "frontend": ["frontend", "front-end", "react", "ui", "ux", "angular", "web "]}.items():
        if any(n in t for n in names):
            return k
    return "other"


print("== gateway & health")
h = api("GET", "/health").json()
check("gateway aggregates health, all services ok", h["status"] == "ok", h)
check("AI reports shared database", h["services"]["ai"].get("database") is True)
check("AI endpoints need a token", api("GET", "/ai/recommendations").status_code == 401)
check("internal AI endpoints are not exposed", api("GET", "/ai/match/candidates").status_code in (404, 401))

print("== registration with skills (no resume)")
r, email = register(skills=["AWS", "Docker", "Kubernetes", "Terraform", "Linux"], desired_role="Cloud Engineer")
check("register returns tokens", r.status_code == 201 and r.json().get("access_token"), r.text[:200])
tok = r.json()["access_token"]
uid = r.json()["user"]["id"]
check("skills saved on user", set(r.json()["user"]["skills"]) >= {"AWS", "Docker"})
rec = api("GET", "/ai/recommendations?limit=15", tok)
check("recommendations 200 without resume", rec.status_code == 200, rec.text[:200])
rj = rec.json()
check("not cold start", rj["cold_start"] is False and rj["source"].startswith("profile"), rj.get("source"))
top = rj["recommendations"][:8]
cloud = sum(fam(j) == "cloud" for j in top)
print("     top titles:", [j["title"] for j in top[:6]])
check("top results are cloud/devops for a cloud skill set", cloud >= 5, f"cloud={cloud}/8")
check("every result has score/reasons/skills", all("match_score" in j and "matching_skills" in j for j in top))
check("spoofed user_id is ignored", api("GET", f"/ai/recommendations?user_id=999999&limit=1", tok).json()["user_id"] == uid)
for m in ("heuristic", "ml", "hybrid"):
    x = api("GET", f"/ai/recommendations?mode={m}&limit=5", tok)
    check(f"mode={m}", x.status_code == 200 and x.json()["mode"] == m and x.json()["count"] == 5)
check("bad mode -> 400", api("GET", "/ai/recommendations?mode=zzz", tok).status_code == 400)

print("== cold start never errors")
r0, _ = register()
t0 = r0.json()["access_token"]
c = api("GET", "/ai/recommendations?limit=5", t0)
check("cold start 200 + flagged", c.status_code == 200 and c.json()["cold_start"] is True and c.json()["count"] == 5)

print("== deck re-ranks after each swipe")
r2, _ = register(skills=["React", "JavaScript", "CSS", "HTML"], desired_role="Frontend Developer")
t2 = r2.json()["access_token"]
d1 = api("GET", "/ai/deck?limit=30", t2).json()
print("     initial deck:", [j["title"] for j in d1["deck"][:5]])
check("deck starts frontend-heavy", sum(fam(j) == "frontend" for j in d1["deck"][:6]) >= 3)
ml_ids = [j["id"] for j in d1["deck"] if fam(j) == "ml"]
if len(ml_ids) < 4:
    allj = api("GET", "/ai/recommendations?limit=100&mode=heuristic", t2).json()["recommendations"]
    ml_ids = [j["id"] for j in allj if fam(j) == "ml"]
fe_ids = [j["id"] for j in d1["deck"] if fam(j) == "frontend"]
prev = d1["order"]
changed = 0
for jid in ml_ids[:4]:
    s = api("POST", f"/jobs/{jid}/swipe", t2, json={"action": "RIGHT"})
    assert s.status_code in (200, 201), s.text
    d = api("GET", "/ai/deck?limit=30", t2).json()
    check(f"swiped job {jid} leaves the deck", jid not in d["order"])
    changed += d["order"] != prev
    prev = d["order"]
for jid in fe_ids[:2]:
    api("POST", f"/jobs/{jid}/swipe", t2, json={"action": "LEFT"})
d2 = api("GET", "/ai/deck?limit=30", t2).json()
print("     deck after ML right-swipes:", [j["title"] for j in d2["deck"][:5]])
check("deck order changed after swipes", changed >= 3)
ml_before = sum(fam(j) == "ml" for j in d1["deck"][:8])
ml_after = sum(fam(j) == "ml" for j in d2["deck"][:8])
check("more ML roles in the top 8 after liking ML roles", ml_after > ml_before, f"{ml_before}->{ml_after}")
check("personalization reports swipes", d2["personalization"]["swipes"]["liked"] >= 4)
rec2 = api("GET", "/ai/recommendations?limit=10", t2).json()
check("recommendations reflect swipes", "swipes" in rec2["source"] and rec2["personalization"]["model"].startswith("embedding"))
check("trained model after enough mixed swipes", "logistic" in rec2["personalization"]["model"], rec2["personalization"]["model"])

print("== resume upload + ATS")
with open(DOCX, "rb") as fh:
    up = api("POST", "/resumes/upload", tok, files={"file": ("sample_resume.docx", fh)})
check("resume upload via gateway", up.status_code in (200, 201), up.text[:300])
body = up.json()
rid = (body.get("resume") or body.get("data") or body).get("id")
ext = (body.get("resume") or body.get("data") or body).get("external_resume_id")
check("resume ids returned", bool(rid) and bool(ext), body)
an = api("GET", f"/ai/resume/{ext}/analysis", tok)
check("analysis 200", an.status_code == 200, an.text[:200])
a = an.json()
check("analysis has score, skills, suggestions", "ats_score" in a and a["detected_skills"] and "suggestions" in a)
job_id = rj["recommendations"][0]["id"]
ats = {m: api("POST", "/resumes/ats/score", tok, json={"resume_id": rid, "job_id": job_id, "mode": m}) for m in ("heuristic", "ml", "hybrid")}
check("ATS all modes 200", all(x.status_code == 200 for x in ats.values()), [x.text[:150] for x in ats.values()])
sc = {m: x.json()["ats"]["ats_score"] for m, x in ats.items() if x.status_code == 200}
print("     ATS scores:", sc)
check("ATS scores in range and modes differ", all(0 <= v <= 100 for v in sc.values()) and len(set(sc.values())) > 1)
other = register()[0].json()["access_token"]
check("other user cannot read my resume analysis", api("GET", f"/ai/resume/{ext}/analysis", other).status_code == 403)
rr = api("GET", "/ai/recommendations?limit=5", tok).json()
check("resume now counted as a source", "resume" in rr["source"], rr["source"])

print("== recruiter flow + notifications")
rl = api("POST", "/auth/login", json={"email": "demo.recruiter@swipex.dev", "password": "Recruiter@123"})
check("recruiter login", rl.status_code == 200, rl.text[:200])
rt = rl.json()["access_token"]
target = rj["recommendations"][1]["id"]
sw = api("POST", f"/jobs/{target}/swipe", tok, json={"action": "RIGHT"})
check("seeker right-swipe = apply", sw.status_code in (200, 201), sw.text[:200])
ap = api("GET", f"/jobs/applicants?job_id={target}", rt).json()
mine = [a for a in ap["applicants"] if a["candidate"]["id"] == uid]
check("recruiter sees the applicant", len(mine) == 1, ap.get("count"))
if mine:
    m0 = mine[0]
    check("applicant carries skills + AI match score", m0["candidate"]["skills"] and m0["match_score"] is not None, m0)
    n0 = api("GET", "/notifications/", rt).json()
    check("recruiter got a new-application notification", any(n["type"] == "application" for n in n0["notifications"]))
    for st in ("Shortlisted", "Interview", "Rejected"):
        p = api("PATCH", f"/jobs/applications/{m0['application_id']}", rt, json={"status": st, "message": "Please check your email"})
        check(f"recruiter sets {st}", p.status_code == 200 and p.json()["applicant"]["status"] == st if p.status_code == 200 else False, p.text[:200])
    ns = api("GET", "/notifications/", tok).json()
    msgs = [n for n in ns["notifications"] if n["type"] == "application"]
    print("     candidate notifications:", [n["title"] for n in msgs])
    check("candidate got 3 status notifications", len(msgs) >= 3 and ns["unread_count"] >= 3)
    check("notification links to the job", all(n["jobId"] == target for n in msgs))
    nid = msgs[0]["id"]
    check("mark read", api("POST", f"/notifications/{nid}/read", tok).status_code == 200)
    check("unread count dropped", api("GET", "/notifications/?unread=true", tok).json()["unread_count"] == ns["unread_count"] - 1)
    check("mark all read", api("POST", "/notifications/read-all", tok).status_code == 200 and api("GET", "/notifications/", tok).json()["unread_count"] == 0)
    check("candidate application list shows new status", any(a.get("status") == "Rejected" for a in api("GET", "/jobs/applications", tok).json().get("applications", [])))
    check("another seeker cannot be changed by a seeker", api("PATCH", f"/jobs/applications/{m0['application_id']}", tok, json={"status": "Hired"}).status_code == 403)
    check("bad status rejected", api("PATCH", f"/jobs/applications/{m0['application_id']}", rt, json={"status": "Banana"}).status_code == 400)

print(f"\n{passes} passed, {len(fails)} failed")
if fails:
    print("FAILED:", fails)
    sys.exit(1)
