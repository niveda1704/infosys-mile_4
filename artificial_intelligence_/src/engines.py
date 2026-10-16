"""Recommendation, deck and ATS engines. Every function has a heuristic and a model (semantic) variant.

mode = "heuristic" -> transparent rules: skill overlap, profile fit, swipe affinity, role keywords
mode = "ml"        -> vector model: sentence embeddings (or the hashing fallback), cosine similarity to a
                      user vector built from profile + resume + recency-decayed swipes, plus a logistic
                      regression trained on the user's own swipes once there are enough of them
mode = "hybrid"    -> weighted blend (default)

A user never needs a resume: skills typed at registration (users.skills), desired role and bio are
enough. Swipes in the shared Postgres re-shape the ranking on the very next request.
"""
import math
import re
from collections import Counter

import numpy as np
from sklearn.linear_model import LogisticRegression

from src import embeddings, job_store
from src.personalize import affinity_score, build_affinity, norm_skill, title_tokens
from src.skills import canonical, extract_skills

MODES = ("heuristic", "ml", "hybrid")
RECENCY_DECAY = 0.92            # weight of a swipe shrinks by 8% for every newer swipe
MIN_LR_POS, MIN_LR_NEG = 2, 2   # swipes of each sign before a logistic regression is trained
HYBRID_W = (0.4, 0.6)           # (heuristic, model)


def _k(skill):
    return norm_skill(canonical(skill))


def _in_text(term, text):
    return bool(re.search(r"(?<![a-z0-9+#])" + re.escape(term) + r"(?![a-z0-9+#])", text))


def _exp_fit(req, years):
    if years is None or not req:
        return None
    nums = [float(n) for n in re.findall(r"\d+(?:\.\d+)?", req)]
    if not nums:
        low = req.lower()
        if any(w in low for w in ("fresher", "entry", "intern", "graduate")):
            return 1.0 if years <= 1 else 0.5
        return None
    lo, hi = (nums[0], nums[1]) if len(nums) > 1 else (nums[0], nums[0] + 2)
    if lo <= years <= hi:
        return 1.0
    return max(0.0, 1 - min(abs(years - lo), abs(years - hi)) / 3)


# ---------------------------------------------------------------- user context
def build_context(user_id=None, extra_skills=None, profile=None, resume=None, resume_ref=None):
    """Merge DB profile (registration skills!), resume (explicit / by ref / latest) and request overrides."""
    user = (job_store.load_user(user_id) if user_id else None) or {}
    profile = dict(profile or {})
    if resume is None and resume_ref:
        resume = job_store.load_resume_by_ref(resume_ref)
    if resume is None and user_id:
        resume = job_store.load_resume(user_id)
    resume = resume or {"skills": [], "text": ""}

    profile_skills = [canonical(s) for s in (user.get("skills") or [])]
    resume_skills = [canonical(s) for s in (resume.get("skills") or [])]
    request_skills = [canonical(s) for s in (extra_skills or []) if str(s).strip()]
    # skills named in the resume text but missing from the stored list
    if resume.get("text"):
        resume_skills += [s for s in extract_skills(resume["text"]) if s not in resume_skills]
    ordered, seen = [], set()
    for s in profile_skills + request_skills + resume_skills:
        if s.lower() not in seen:
            seen.add(s.lower())
            ordered.append(s)

    merged = {
        "location": profile.get("location") or user.get("location") or "",
        "experience_years": profile.get("experience_years", user.get("experience_years")),
        "desired_role": profile.get("desired_role") or profile.get("target_roles") or user.get("desired_role") or "",
        "remote_preference": profile.get("remote_preference"),
        "preferred_job_type": profile.get("preferred_job_type"),
        "bio": profile.get("bio") or user.get("bio") or "",
    }
    if isinstance(merged["desired_role"], list):
        merged["desired_role"] = ", ".join(map(str, merged["desired_role"]))
    profile_text = " ".join(filter(None, [
        merged["desired_role"], ("Skills: " + ", ".join(ordered)) if ordered else "", merged["bio"][:500]]))
    return {
        "user_id": user_id,
        "skills": ordered,
        "skill_keys": {_k(s) for s in ordered},
        "profile": merged,
        "profile_text": profile_text.strip(),
        "resume_text": (resume.get("text") or "").strip(),
        "sources": {"profile_skills": len(profile_skills), "request_skills": len(request_skills),
                    "resume_skills": len(resume_skills), "has_resume": bool(resume_skills or resume.get("text"))},
    }


def _has_profile_signal(ctx):
    return bool(ctx["skills"] or ctx["resume_text"] or ctx["profile"]["desired_role"])


# ---------------------------------------------------------------- heuristic scorer
def heuristic_score(job, ctx, aff):
    """-> {score 0..1, matched, missing, reasons}"""
    matched = [s for s in job["skills"] if _k(s) in ctx["skill_keys"]]
    missing = [s for s in job["skills"] if _k(s) not in ctx["skill_keys"]]
    parts, reasons = [], []
    p = ctx["profile"]

    if ctx["skill_keys"]:
        ratio = len(matched) / len(job["skills"]) if job["skills"] else 0.4
        parts.append((0.45, ratio))
        if matched and (len(matched) >= 2 or ratio >= 0.5):
            reasons.append("Matches your skills: " + ", ".join(matched[:4]))

    pf = []
    if p["location"]:
        hit = p["location"].lower() in job["location"].lower() or job["remote"]
        pf.append(1.0 if hit else 0.0)
        if hit and not job["remote"]:
            reasons.append("In your preferred location")
    if p["remote_preference"]:
        pf.append(1.0 if job["remote"] else 0.3)
    if p["preferred_job_type"]:
        pf.append(1.0 if str(p["preferred_job_type"]).lower() == job["job_type"].lower() else 0.2)
    fit = _exp_fit(job["experience"], p["experience_years"])
    if fit is not None:
        pf.append(fit)
        if fit == 1.0:
            reasons.append("Fits your experience level")
    if pf:
        parts.append((0.15, sum(pf) / len(pf)))

    if p["desired_role"]:
        role_toks = set(re.findall(r"[a-z][a-z+.#]{2,}", p["desired_role"].lower())) - {"engineer", "developer"}
        jt = title_tokens(job)
        if role_toks:
            cov = len(role_toks & jt) / len(role_toks)
            parts.append((0.15, cov))
            if cov >= 0.5:
                reasons.append("Matches your target role")

    a, why = affinity_score(job, aff)
    if aff["n"]:
        parts.append((0.25 * min(1.0, aff["n"] / 5), (a + 1) / 2))
        if why:
            reasons.append(why)

    if job["remote"]:
        reasons.append("Remote friendly")
    tw = sum(w for w, _ in parts)
    score = sum(w * v for w, v in parts) / tw if tw else 0.0
    return {"score": score, "matched": matched, "missing": missing, "reasons": reasons}


# ---------------------------------------------------------------- vector model
def user_vector(ctx, events, index):
    """Query vector = normalised(profile + resume) + recency-weighted liked centroid - disliked centroid.

    Returns (vector or None, details)."""
    parts = []
    if ctx["profile_text"]:
        parts.append(1.0 * embeddings.encode_text(ctx["profile_text"]))
    if ctx["resume_text"]:
        parts.append(0.8 * embeddings.encode_text(ctx["resume_text"][:3000]))
    base = np.sum(parts, axis=0) if parts else None
    if base is not None and np.linalg.norm(base):
        base = base / np.linalg.norm(base)

    pos = np.zeros(index.matrix.shape[1], dtype=np.float64)
    neg = np.zeros_like(pos)
    wp = wn = 0.0
    for jid, ev in events.items():
        i = index.pos.get(jid)
        if i is None:
            continue
        w = abs(ev["w"]) * (RECENCY_DECAY ** ev["age"])
        if ev["w"] > 0:
            pos += w * index.matrix[i]
            wp += w
        elif ev["w"] < 0:
            neg += w * index.matrix[i]
            wn += w
    q = np.zeros_like(pos) if base is None else base.astype(np.float64)
    if wp:
        q += min(1.5, 0.35 * wp) * (pos / wp)
    if wn:
        q -= 0.6 * min(1.5, 0.35 * wn) * (neg / wn)
    n = np.linalg.norm(q)
    details = {"liked": int(sum(1 for e in events.values() if e["w"] > 0)),
               "skipped": int(sum(1 for e in events.values() if e["w"] < 0))}
    return (q / n if n else None), details


def _train_lr(index, events):
    """Logistic regression on the user's own swipes (rows = job vectors). None when too little data."""
    rows, y, sw = [], [], []
    for jid, ev in events.items():
        i = index.pos.get(jid)
        if i is not None and ev["w"] != 0:
            rows.append(i)
            y.append(1 if ev["w"] > 0 else 0)
            sw.append(abs(ev["w"]) * (RECENCY_DECAY ** ev["age"]))
    y = np.asarray(y)
    if len(y) < MIN_LR_POS + MIN_LR_NEG or (y == 1).sum() < MIN_LR_POS or (y == 0).sum() < MIN_LR_NEG:
        return None
    clf = LogisticRegression(C=0.8, class_weight="balanced", max_iter=300)
    clf.fit(index.matrix[rows], y, sample_weight=np.asarray(sw) + 1e-3)
    return clf


def score_jobs(index, ctx, events, mode="hybrid"):
    """Score every job in the index. -> (list of records, personalization info)."""
    emb = embeddings.get_embedder()
    jobs = index.jobs
    aff = build_affinity({jid: e["w"] for jid, e in events.items()}, index.by_id)
    heur = [heuristic_score(j, ctx, aff) for j in jobs]
    h = np.asarray([r["score"] for r in heur]) if jobs else np.zeros(0)

    q, det = user_vector(ctx, events, index)
    sem = emb.calibrate(index.matrix @ q) if (q is not None and len(jobs)) else np.zeros(len(jobs))
    model_name, proba = None, None
    if q is not None:
        model_name = "embedding-cosine"
        if events:
            model_name = "embedding-cosine+swipe-centroids"
            clf = _train_lr(index, events)
            if clf is not None and len(jobs):
                proba = clf.predict_proba(index.matrix)[:, 1]
                model_name = "embedding-cosine+logistic-regression"
    ml = sem if proba is None else 0.55 * sem + 0.45 * proba

    if mode == "heuristic":
        final = h
    elif mode == "ml":
        final = ml if q is not None else h
    else:
        final = HYBRID_W[0] * h + HYBRID_W[1] * ml if q is not None else h

    records = []
    for i, j in enumerate(jobs):
        ev = events.get(j["id"])
        f = float(final[i])
        if ev and ev["w"] < 0:
            f *= 0.4  # already skipped: sink it
        records.append({"job": j, "h": heur[i], "sem": float(sem[i]), "ml": float(ml[i]), "final": f,
                        "signal": None if not ev else ("liked" if ev["w"] > 0 else "skipped")})
    info = {
        "skills_used": ctx["skills"][:30], "skill_sources": ctx["sources"],
        "swipes": det, "model": model_name if mode != "heuristic" else "heuristic-v3",
        "embedding": emb.info(),
    }
    return records, info, q


def _reasons(rec, index, events, q):
    reasons = list(rec["h"]["reasons"])
    j = rec["job"]
    if rec["sem"] >= 0.6:
        reasons.append("Closely related to your profile")
    liked = [jid for jid, e in events.items() if e["w"] > 0 and jid in index.pos and jid != j["id"]]
    if liked:
        sims = index.matrix[[index.pos[x] for x in liked]] @ index.matrix[index.pos[j["id"]]]
        k = int(np.argmax(sims))
        if sims[k] >= 0.5 or emb_calibrated(sims[k]) >= 0.55:
            reasons.append(f"Similar to \"{index.by_id[liked[k]]['title']}\" you liked")
    seen, out = set(), []
    for r in reasons:
        if r not in seen:
            seen.add(r)
            out.append(r)
    return out[:4]


def emb_calibrated(c):
    return float(embeddings.get_embedder().calibrate(c))


def _public(rec, reasons, rank=None):
    j = rec["job"]
    return {
        "id": j["id"], "job_id": j["id"], "title": j["title"], "job_title": j["title"],
        "company": j["company"], "location": j["location"], "salary": j["salary"], "remote": j["remote"],
        "skills": j["skills"], "job_type": j["job_type"], "experience": j["experience"],
        "match_score": int(round(100 * max(0.0, min(1.0, rec["final"])))),
        "semantic_score": int(round(100 * rec["sem"])),
        "matchingSkills": rec["h"]["matched"], "missingSkills": rec["h"]["missing"],
        "matching_skills": rec["h"]["matched"], "missing_skills": rec["h"]["missing"],
        "reasons": reasons, "user_signal": rec["signal"],
    }


def _cold_start_records(index, pop):
    """No profile, resume or swipes: newest and most-applied jobs first."""
    jobs = index.jobs
    if not jobs:
        return []
    mx = max([pop.get(j["id"], 0) for j in jobs] + [1])
    n = len(jobs)
    out = []
    for i, j in enumerate(sorted(jobs, key=lambda x: x["id"], reverse=True)):
        recency = 1 - i / max(1, n)
        pscore = pop.get(j["id"], 0) / mx
        out.append({"job": j, "h": {"matched": [], "missing": list(j["skills"]), "reasons": ["Popular right now"
                    if pscore > 0.5 else "New listing"]}, "sem": 0.0, "ml": 0.0,
                    "final": 0.25 + 0.2 * recency + 0.15 * pscore, "signal": None})
    return out


def _mode(mode):
    mode = (mode or "hybrid").strip().lower()
    if mode not in MODES:
        raise ValueError(f"mode must be one of {list(MODES)}")
    return mode


def recommend(user_id, mode="hybrid", limit=20, extra_skills=None, profile=None, resume=None,
              resume_ref=None, exclude_seen=False):
    mode = _mode(mode)
    index = embeddings.get_index()
    ctx = build_context(user_id, extra_skills, profile, resume, resume_ref)
    events = job_store.load_swipe_events(user_id) if user_id else {}
    cold = not (_has_profile_signal(ctx) or events)
    if cold:
        records = _cold_start_records(index, job_store.popularity())
        info = {"skills_used": [], "skill_sources": ctx["sources"], "swipes": {"liked": 0, "skipped": 0},
                "model": None, "embedding": embeddings.get_embedder().info()}
        q = None
    else:
        records, info, q = score_jobs(index, ctx, events, mode)
    if exclude_seen:
        seen = job_store.seen_job_ids(user_id)
        records = [r for r in records if r["job"]["id"] not in seen]
    records.sort(key=lambda r: (-r["final"], r["job"]["id"]))
    top = records[:limit]
    return {
        "user_id": user_id, "mode": mode, "cold_start": cold,
        "source": _source(ctx, events, cold),
        "personalization": info, "total_jobs": len(index.jobs), "count": len(top),
        "message": ("Add skills to your profile or swipe on a few jobs to personalise this list."
                    if cold else None),
        "recommendations": [_public(r, _reasons(r, index, events, q) if not cold else r["h"]["reasons"])
                            for r in top],
    }


def _source(ctx, events, cold):
    if cold:
        return "cold_start"
    s = []
    if ctx["sources"]["profile_skills"] or ctx["profile"]["desired_role"]:
        s.append("profile")
    if ctx["sources"]["request_skills"]:
        s.append("request")
    if ctx["sources"]["has_resume"]:
        s.append("resume")
    if events:
        s.append("swipes")
    return "+".join(s) or "swipes"


def deck(user_id, limit=30, mode="hybrid", diversity=0.8, extra_skills=None, profile=None):
    """Ordered job ids for the swipe deck: unseen jobs only, ranked, then diversified with MMR so the
    top of the deck is not ten near-duplicates. Re-run after every swipe."""
    mode = _mode(mode)
    index = embeddings.get_index()
    ctx = build_context(user_id, extra_skills, profile)
    events = job_store.load_swipe_events(user_id) if user_id else {}
    seen = job_store.seen_job_ids(user_id) if user_id else set()
    cold = not (_has_profile_signal(ctx) or events)
    if cold:
        records, info, q = _cold_start_records(index, job_store.popularity()), {"model": None}, None
    else:
        records, info, q = score_jobs(index, ctx, events, mode)
    records = [r for r in records if r["job"]["id"] not in seen]
    records.sort(key=lambda r: (-r["final"], r["job"]["id"]))
    pool = records[: max(limit * 3, 60)]
    chosen = []
    if pool:
        vecs = np.vstack([index.matrix[index.pos[r["job"]["id"]]] for r in pool])
        remaining = list(range(len(pool)))
        max_sim = np.zeros(len(pool))
        while remaining and len(chosen) < limit:
            best = max(remaining, key=lambda i: diversity * pool[i]["final"] - (1 - diversity) * max_sim[i])
            chosen.append(best)
            remaining.remove(best)
            max_sim = np.maximum(max_sim, vecs @ vecs[best])
    out = [pool[i] for i in chosen]
    return {
        "user_id": user_id, "mode": mode, "cold_start": cold,
        "order": [r["job"]["id"] for r in out],
        "scores": {str(r["job"]["id"]): int(round(100 * max(0.0, min(1.0, r["final"])))) for r in out},
        "deck": [_public(r, r["h"]["reasons"][:3]) for r in out],
        "remaining_unseen": len(records),
        "personalization": info,
    }


# ---------------------------------------------------------------- ATS
_SECTIONS = {
    "summary": r"\b(summary|objective|profile|about me)\b",
    "experience": r"\b(experience|employment|internship|work history)\b",
    "education": r"\b(education|academic|b\.?tech|bachelor|degree|university)\b",
    "skills": r"\b(skills|technologies|tech stack|technical skills)\b",
    "projects": r"\b(projects?|portfolio)\b",
}
_STOP_KW = set("""the and for with that this from will have your you our are can able work team using use used
experience years year role must should including strong good knowledge ability skills preferred required
candidate company looking build develop design implement across within their they about more such also any
all new one two""".split())


def _format_score(text):
    low = (text or "").lower()
    found = [s for s, rx in _SECTIONS.items() if re.search(rx, low)]
    missing = [s for s in _SECTIONS if s not in found]
    has_email = bool(re.search(r"[\w.+-]+@[\w-]+\.[\w.]+", text or ""))
    has_phone = bool(re.search(r"(?:\+?\d[\d\s().-]{8,}\d)", text or ""))
    words = len(re.findall(r"\w+", text or ""))
    length = 1.0 if 200 <= words <= 1100 else (0.6 if 100 <= words <= 1600 else 0.25 if words else 0.0)
    bullets = 1.0 if re.search(r"(^|\n)\s*[-•*▪●]", text or "") else 0.6
    score = 100 * (0.45 * len(found) / len(_SECTIONS) + 0.2 * has_email + 0.1 * has_phone
                   + 0.15 * length + 0.1 * bullets)
    return round(min(100.0, score), 1), missing, has_email, has_phone


def _resume_vec_and_chunks(resume):
    text = (resume.get("text") or "").strip()
    skills = ", ".join(resume.get("skills") or [])
    doc = (text[:3500] + (" Skills: " + skills if skills else "")).strip() or ("Skills: " + skills)
    return embeddings.encode_text(doc), text, skills


def _chunks(text, size=450, cap=10):
    paras = [p.strip() for p in re.split(r"\n\s*\n|\n(?=[A-Z][A-Za-z ]{2,25}\n)", text) if p.strip()]
    chunks, cur = [], ""
    for p in paras:
        if len(cur) + len(p) > size and cur:
            chunks.append(cur)
            cur = p
        else:
            cur = (cur + "\n" + p).strip()
    if cur:
        chunks.append(cur)
    return chunks[:cap]


def semantic_similarity(resume, job_vec):
    """0..1: blend of whole-resume cosine and the average of the 3 best resume-chunk cosines."""
    emb = embeddings.get_embedder()
    rv, text, _ = _resume_vec_and_chunks(resume)
    whole = float(emb.calibrate(float(rv @ job_vec)))
    chunks = _chunks(text) if len(text) > 600 else []
    if not chunks:
        return whole
    sims = np.sort(emb.encode(chunks) @ job_vec)[::-1][:3]
    return 0.5 * whole + 0.5 * float(emb.calibrate(float(np.mean(sims))))


def _job_vec(job):
    idx = embeddings.get_index()
    i = idx.pos.get(job["id"])
    return idx.matrix[i] if i is not None else embeddings.encode_text(embeddings.job_text(job))


def _job_keywords(job, skill_keys, n=12):
    toks = re.findall(r"[a-z][a-z+#.]{3,}", (job["description"] + " " + job["qualifications"]).lower())
    cnt = Counter(t.rstrip(".") for t in toks if t not in _STOP_KW and norm_skill(t) not in skill_keys)
    return [w for w, _ in cnt.most_common(n)]


def _ats_parts(resume, job):
    text = (resume.get("text") or "").lower()
    rskills = {_k(s) for s in resume.get("skills") or []}
    jskills = job["skills"] or extract_skills(job["description"])
    matched = [s for s in jskills if _k(s) in rskills or _in_text(_k(s), text)]
    missing = [s for s in jskills if s not in matched]
    skill_cov = len(matched) / len(jskills) if jskills else 0.0
    kws = _job_keywords(job, {_k(s) for s in jskills})
    kw_hit = [w for w in kws if _in_text(w, text)]
    kw_cov = len(kw_hit) / len(kws) if kws else 0.0
    toks = title_tokens(job)
    title_cov = sum(_in_text(t, text) or t in {s.lower() for s in resume.get("skills") or []} for t in toks) / len(toks) if toks else 0.0
    fmt, missing_sections, has_email, has_phone = _format_score(resume.get("text") or "")
    return {"matched": matched, "missing": missing, "skill_cov": skill_cov, "kw_cov": kw_cov,
            "missing_kw": [w for w in kws if w not in kw_hit][:8], "title_cov": title_cov, "fmt": fmt,
            "missing_sections": missing_sections, "has_email": has_email, "has_phone": has_phone,
            "n_job_skills": len(jskills)}


def ats_score(resume, job, mode="hybrid"):
    mode = _mode(mode)
    a = _ats_parts(resume, job)
    keyword = 100 * (0.7 * a["skill_cov"] + 0.3 * a["kw_cov"])
    heur = 0.6 * keyword + 0.15 * 100 * a["title_cov"] + 0.25 * a["fmt"]
    sem = 100 * semantic_similarity(resume, _job_vec(job))
    model = 0.8 * sem + 0.2 * a["fmt"]
    if mode == "heuristic":
        score, by = heur, "heuristic-v3"
    elif mode == "ml":
        score, by = model, "semantic-embedding-v1"
    else:
        score, by = 0.6 * heur + 0.4 * model, "hybrid-v3"
    score = round(max(0.0, min(100.0, score)), 2)
    tips = []
    if a["missing"]:
        tips.append("Add these skills if you have them: " + ", ".join(a["missing"][:6]) + ".")
    if a["missing_kw"]:
        tips.append("Mirror the job's wording: " + ", ".join(a["missing_kw"][:5]) + ".")
    if a["missing_sections"]:
        tips.append("Add missing sections: " + ", ".join(a["missing_sections"]) + ".")
    if not a["has_email"] or not a["has_phone"]:
        tips.append("Put a clear email address and phone number at the top.")
    if sem < 40:
        tips.append("The overall content reads far from this role; tailor your summary and project bullets to it.")
    return {
        "ats_score": score, "match_score": score, "mode": mode, "generated_by": by,
        "job_id": job["id"], "job_title": job["title"],
        "score_breakdown": {"keyword_relevance": round(keyword, 1), "format_readability": a["fmt"],
                            "title_match": round(100 * a["title_cov"], 1),
                            "semantic_similarity": round(sem, 1), "heuristic_score": round(heur, 1),
                            "model_score": round(model, 1)},
        "matching_skills": a["matched"], "matched_skills": a["matched"],
        "missing_skills": a["missing"], "missing_keywords": a["missing_kw"],
        "missing_sections": a["missing_sections"], "suggestions": tips,
        "embedding": embeddings.get_embedder().info()["backend"],
    }


def resume_analysis(resume, mode="hybrid"):
    """Job-agnostic: how the resume looks to an ATS and which live jobs it already fits."""
    mode = _mode(mode)
    index = embeddings.get_index()
    skills = [canonical(s) for s in resume.get("skills") or []]
    text = resume.get("text") or ""
    skills += [s for s in extract_skills(text, job_store.job_skill_vocabulary()) if s not in skills]
    resume = {"skills": skills, "text": text}
    fmt, missing_sections, has_email, has_phone = _format_score(text)
    ctx = build_context(None, resume=resume)
    ranked = []
    if index.jobs:
        records, _, _ = score_jobs(index, ctx, {}, mode)
        records.sort(key=lambda r: -r["final"])
        ranked = records[:5]
    top_fit = float(np.mean([r["final"] for r in ranked[:3]])) if ranked else 0.0
    cover = float(np.mean([len(r["h"]["matched"]) / max(1, len(r["job"]["skills"])) for r in ranked[:3]])) if ranked else 0.0
    gap = Counter(s for r in ranked[:3] for s in r["h"]["missing"])
    missing_skills = [s for s, _ in gap.most_common(8)]
    keyword = round(100 * cover, 2)
    fit = round(100 * top_fit, 2)
    ats = round(0.4 * keyword + 0.3 * fmt + 0.3 * fit, 2)
    tips = []
    if len(skills) < 8:
        tips.append(f"Only {len(skills)} skills were detected. List more tools and technologies you have actually used.")
    if missing_sections:
        tips.append("Add missing sections: " + ", ".join(missing_sections) + ".")
    if not has_email or not has_phone:
        tips.append("Include a clear email address and phone number at the top.")
    if missing_skills:
        tips.append("Roles that fit you often ask for: " + ", ".join(missing_skills[:5]) + ".")
    return {
        "ats_score": ats, "match_score": ats, "job_profile_fit": fit, "mode": mode,
        "generated_by": {"heuristic": "heuristic-v3", "ml": "semantic-embedding-v1", "hybrid": "hybrid-v3"}[mode],
        "score_breakdown": {"keyword_relevance": keyword, "format_readability": fmt, "job_profile_fit": fit},
        "detected_skills": skills, "missing_skills": missing_skills, "missing_keywords": missing_skills,
        "missing_sections": missing_sections, "suggestions": tips,
        "top_matching_jobs": [{"id": r["job"]["id"], "title": r["job"]["title"], "company": r["job"]["company"],
                               "score": round(100 * r["final"], 1), "missing_skills": r["h"]["missing"]}
                              for r in ranked],
        "embedding": embeddings.get_embedder().info()["backend"],
    }


def candidate_match(job_id, user_ids):
    """Recruiter view: how well each applicant fits one job. -> {user_id: {score, matching_skills, missing_skills}}"""
    job = job_store.load_job(job_id)
    if not job:
        return None
    out = {}
    for uid in user_ids:
        user = job_store.load_user(uid) or {}
        res = job_store.load_resume(uid)
        text = res["text"] or " ".join(filter(None, [user.get("desired_role"), user.get("bio")]))
        skills = list(dict.fromkeys([canonical(s) for s in (user.get("skills") or []) + res["skills"]]))
        r = ats_score({"skills": skills, "text": text}, job, "hybrid")
        out[str(uid)] = {"score": int(round(r["ats_score"])), "matching_skills": r["matching_skills"],
                         "missing_skills": r["missing_skills"],
                         "semantic_similarity": r["score_breakdown"]["semantic_similarity"]}
    return out
