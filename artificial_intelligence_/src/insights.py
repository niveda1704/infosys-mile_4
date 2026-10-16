"""Career insights for the analytics dashboard: skill gap and recommendation insights."""
from collections import Counter, defaultdict

from src import embeddings, engines, job_store
from src.personalize import families, norm_skill
from src.skills import canonical


def _k(s):
    return norm_skill(canonical(s))


def skill_gap(user_id, top_n=10):
    """Skills demanded by the jobs the user is aiming at but missing from their profile/resume.

    Target jobs = jobs they liked / applied to / saved (recency weighted); topped up with their best
    recommendations when they have few swipes, so a brand-new user with profile skills still gets a gap."""
    index = embeddings.get_index()
    ctx = engines.build_context(user_id)
    events = job_store.load_swipe_events(user_id)
    weights = {}
    for jid, ev in events.items():
        if ev["w"] > 0 and jid in index.by_id:
            weights[jid] = ev["w"] * (engines.RECENCY_DECAY ** ev["age"])
    basis = "your liked and applied jobs"
    if len(weights) < 5 and (ctx["skills"] or ctx["resume_text"] or ctx["profile"]["desired_role"]):
        recs = engines.recommend(user_id, "hybrid", 10)["recommendations"]
        for r in recs:
            weights.setdefault(r["id"], 0.4)
        basis = "your top recommended jobs" if not events else "your liked jobs and top recommendations"
    if not weights:
        return {"user_id": user_id, "has_signal": False, "basis": None, "gaps": [], "strengths": [],
                "coverage": None, "message": "Add skills to your profile or swipe on jobs to see your skill gap."}

    demand, jobs_needing, total = defaultdict(float), Counter(), sum(weights.values())
    display = {}
    for jid, w in weights.items():
        for s in index.by_id[jid]["skills"]:
            key = _k(s)
            demand[key] += w
            jobs_needing[key] += 1
            display.setdefault(key, canonical(s))
    have = ctx["skill_keys"]
    rows = [{"skill": display[k], "demand_pct": round(100 * d / total, 1), "jobs": jobs_needing[k]}
            for k, d in demand.items()]
    gaps = sorted([r for r in rows if _k(r["skill"]) not in have], key=lambda r: (-r["demand_pct"], r["skill"]))
    strengths = sorted([r for r in rows if _k(r["skill"]) in have], key=lambda r: (-r["demand_pct"], r["skill"]))
    covered = sum(d for k, d in demand.items() if k in have)
    return {"user_id": user_id, "has_signal": True, "basis": basis, "target_jobs": len(weights),
            "coverage": round(100 * covered / sum(demand.values()), 1) if demand else None,
            "gaps": gaps[:top_n], "strengths": strengths[:top_n],
            "learn_next": [g["skill"] for g in gaps[:5]]}


def recommendation_insights(user_id):
    """Why jobs are recommended: role-family interest from swipes, swipe summary, top reasons."""
    index = embeddings.get_index()
    events = job_store.load_swipe_events(user_id)
    fam = defaultdict(lambda: {"liked": 0, "skipped": 0})
    for jid, ev in events.items():
        job = index.by_id.get(jid)
        if not job or ev["w"] == 0:
            continue
        top = max(families(job).items(), key=lambda kv: kv[1], default=(None, 0))[0]
        if top:
            fam[top]["liked" if ev["w"] > 0 else "skipped"] += 1
    liked = sum(1 for e in events.values() if e["w"] > 0)
    skipped = sum(1 for e in events.values() if e["w"] < 0)
    interests = sorted(({"family": f.replace("_", "/"), **v, "score": v["liked"] - v["skipped"]}
                        for f, v in fam.items()), key=lambda r: (-r["score"], r["family"]))
    rec = engines.recommend(user_id, "hybrid", 8)
    pers = rec["personalization"]
    reasons = Counter(r for item in rec["recommendations"] for r in item["reasons"])
    notes = []
    if interests and interests[0]["score"] > 0:
        notes.append(f"You lean towards {interests[0]['family']} roles "
                     f"({interests[0]['liked']} liked, {interests[0]['skipped']} skipped).")
    if pers.get("skills_used"):
        notes.append("Your skills used for matching: " + ", ".join(pers["skills_used"][:6]) + ".")
    if pers.get("model") and "logistic" in pers["model"]:
        notes.append("A model trained on your own swipes is now part of the ranking.")
    elif liked + skipped < 6:
        notes.append("Swipe on a few more jobs (left and right) to train your personal ranking model.")
    if rec["cold_start"]:
        notes = ["Add skills to your profile or swipe on jobs to personalise recommendations."]
    return {"user_id": user_id, "cold_start": rec["cold_start"], "source": rec["source"],
            "swipes": {"total": liked + skipped, "liked": liked, "skipped": skipped,
                       "like_rate": round(100 * liked / (liked + skipped), 1) if liked + skipped else None},
            "interests": interests[:6], "model": pers.get("model"), "embedding": pers.get("embedding"),
            "top_reasons": [{"reason": r, "count": c} for r, c in reasons.most_common(6)],
            "notes": notes,
            "top_recommendations": [{"id": r["id"], "title": r["title"], "company": r["company"],
                                     "match_score": r["match_score"], "reasons": r["reasons"]}
                                    for r in rec["recommendations"][:5]]}
