"""Swipe-based preference learning.

Every job is mapped to one or more role families (cloud/devops, backend, ml/ai ...). Right-swipes
raise the user's affinity for those families, their skills and title words; left-swipes lower it.
Scoring a new job then reuses the same affinities, so "swiped right on cloud roles" -> more cloud roles.
"""
import math
import re

FAMILIES = {
    "cloud_devops": ["aws", "azure", "gcp", "google cloud", "cloud", "kubernetes", "k8s", "docker",
                     "terraform", "ansible", "jenkins", "ci/cd", "devops", "sre", "infrastructure",
                     "deployment", "linux"],
    "backend": ["backend", "back-end", "api", "rest api", "flask", "django", "fastapi", "spring",
                "node.js", "express", "microservices", "postgresql", "mongodb", "java", "golang"],
    "frontend": ["frontend", "front-end", "react", "vue", "angular", "javascript", "typescript",
                 "html", "css", "tailwind", "next.js", "ui"],
    "data": ["data analyst", "data engineer", "analytics", "power bi", "tableau", "excel", "etl",
             "spark", "pandas", "statistics", "bigquery", "sql"],
    "ml_ai": ["machine learning", "deep learning", "nlp", "tensorflow", "pytorch", "scikit-learn",
              "ai engineer", "llm", "rag", "langchain", "computer vision", "data scientist"],
    "mobile": ["android", "ios", "flutter", "kotlin", "swift", "react native", "mobile"],
    "security": ["security", "cybersecurity", "pentest", "soc", "siem", "owasp", "infosec"],
}
_FAMILY_RE = {
    f: re.compile(r"(?<![a-z0-9])(?:" + "|".join(re.escape(k) for k in kws) + r")(?![a-z0-9])")
    for f, kws in FAMILIES.items()
}
_ALIASES = {
    "k8s": "kubernetes", "js": "javascript", "node": "node.js", "nodejs": "node.js",
    "ml": "machine learning", "postgres": "postgresql", "reactjs": "react", "rest": "rest api",
    "restful api": "rest api", "sklearn": "scikit-learn", "amazon web services": "aws",
    "gcp": "google cloud", "py": "python", "ts": "typescript",
}
_GENERIC_TITLE = {"engineer", "developer", "intern", "senior", "junior", "lead", "associate",
                  "trainee", "the", "and", "for", "with"}


def norm_skill(s):
    s = str(s).strip().lower()
    return _ALIASES.get(s, s)


def families(job):
    """Share of each role family in a job (shares sum to 1). Title counts most, then skills."""
    title = job["title"].lower()
    skills = " , ".join(job["skills"]).lower()
    desc = job["description"].lower()
    counts = {}
    for f, rx in _FAMILY_RE.items():
        c = 3 * len(rx.findall(title)) + 2 * len(rx.findall(skills)) + 0.5 * min(len(rx.findall(desc)), 4)
        if c > 0:
            counts[f] = c
    total = sum(counts.values())
    return {f: c / total for f, c in counts.items()} if total else {}


def title_tokens(job):
    return {t for t in re.findall(r"[a-z][a-z+.#]{2,}", job["title"].lower()) if t not in _GENERIC_TITLE}


def build_affinity(swipes, jobs_by_id):
    """swipes: {job_id: weight in [-1,1]} -> affinity tables used by affinity_score()."""
    aff = {"family": {}, "skill": {}, "token": {}, "n": 0}
    for jid, w in swipes.items():
        job = jobs_by_id.get(jid)
        if not job:
            continue
        aff["n"] += 1
        for f, share in families(job).items():
            aff["family"][f] = aff["family"].get(f, 0.0) + w * share
        for s in job["skills"]:
            k = norm_skill(s)
            aff["skill"][k] = aff["skill"].get(k, 0.0) + 0.5 * w
        for t in title_tokens(job):
            aff["token"][t] = aff["token"].get(t, 0.0) + 0.5 * w
    return aff


def affinity_score(job, aff):
    """-> (score in [-1, 1], human-readable reason or None)."""
    if not aff["n"]:
        return 0.0, None
    fams = families(job)
    fam = sum(share * math.tanh(aff["family"].get(f, 0.0)) for f, share in fams.items())
    sk = [math.tanh(aff["skill"].get(norm_skill(s), 0.0)) for s in job["skills"]]
    tk = [math.tanh(aff["token"].get(t, 0.0)) for t in title_tokens(job)]
    score = 0.55 * fam + 0.30 * (sum(sk) / len(sk) if sk else 0.0) + 0.15 * (sum(tk) / len(tk) if tk else 0.0)
    reason = None
    if fam > 0.2 and fams:
        best = max(fams, key=lambda f: fams[f] * math.tanh(aff["family"].get(f, 0.0)))
        reason = f"You liked {best.replace('_', '/')} roles"
    return max(-1.0, min(1.0, score)), reason
