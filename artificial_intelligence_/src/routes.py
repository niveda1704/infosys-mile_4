"""HTTP API of the AI service. Everything lives under /api/v1 and is reached through the gateway,
which verifies the JWT and injects ?user_id=. Direct calls are accepted only when INTERNAL_API_KEY is
unset or matches the X-Internal-Key header."""
import hmac
import io
import os
import re
from typing import Optional

from fastapi import APIRouter, Depends, File, Header, HTTPException, Query, UploadFile
from pydantic import BaseModel, Field

from src import embeddings, engines, insights, job_store
from src.parser import extract_text
from src.skills import extract_skills

MAX_UPLOAD = 8 * 1024 * 1024


def require_internal(x_internal_key: Optional[str] = Header(None)):
    expected = os.getenv("INTERNAL_API_KEY", "")
    if expected and not hmac.compare_digest(expected, x_internal_key or ""):
        raise HTTPException(401, "Missing or invalid internal key.")


router = APIRouter(prefix="/api/v1", dependencies=[Depends(require_internal)])


def _mode(mode):
    mode = (mode or "hybrid").strip().lower()
    if mode not in engines.MODES:
        raise HTTPException(400, f"mode must be one of {list(engines.MODES)}")
    return mode


def _uid(user_id):
    if user_id in (None, ""):
        return None
    if not str(user_id).isdigit():
        raise HTTPException(400, "user_id must be a numeric id.")
    return int(user_id)


def _resume_for(ref, user_id):
    res = job_store.load_resume_by_ref(ref)
    if not res:
        raise HTTPException(404, f"Resume '{ref}' not found.")
    if user_id is not None and res.get("user_id") is not None and res["user_id"] != user_id:
        raise HTTPException(403, "This resume belongs to another user.")
    return res


@router.post("/resume/upload", status_code=201, summary="Parse a PDF/DOCX resume and store it")
async def upload_resume(file: UploadFile = File(...), user_id: Optional[str] = Query(None)):
    uid = _uid(user_id)
    if not file or not file.filename:
        raise HTTPException(400, "No file uploaded.")
    if not file.filename.lower().endswith((".pdf", ".docx")):
        raise HTTPException(400, "Invalid file type. Only .pdf and .docx files are supported.")
    content = await file.read()
    if not content:
        raise HTTPException(400, "Uploaded file is empty.")
    if len(content) > MAX_UPLOAD:
        raise HTTPException(413, "File too large (max 8 MB).")
    try:
        text = extract_text(io.BytesIO(content), file.filename)
    except ValueError as exc:
        raise HTTPException(400, f"Unreadable resume: {exc}")
    skills = extract_skills(text, job_store.job_skill_vocabulary())
    rid = job_store.save_ai_resume(uid, skills, text, file.filename)
    return {"resume_id": rid, "filename": file.filename, "user_id": uid,
            "parsed_skills": skills, "skills": skills, "raw_text": text, "char_count": len(text)}


@router.get("/resume", summary="Latest parsed resume of a user")
def latest_resume(user_id: str = Query(...)):
    res = job_store.load_resume(_uid(user_id))
    return {"skills": res["skills"], "raw_text": res["text"], "has_resume": bool(res["skills"] or res["text"])}


@router.get("/resume/{resume_id}/ats-score", summary="ATS score of a resume against one job")
def ats(resume_id: str, job_id: str = Query(...), mode: str = Query("hybrid"), user_id: Optional[str] = None):
    res = _resume_for(resume_id, _uid(user_id))
    job = job_store.load_job(job_id)
    if not job:
        raise HTTPException(404, f"Job '{job_id}' not found.")
    return engines.ats_score(res, job, _mode(mode))


@router.get("/resume/{resume_id}/analysis", summary="Job-agnostic ATS analysis of a resume")
def analysis(resume_id: str, mode: str = Query("hybrid"), user_id: Optional[str] = None):
    return engines.resume_analysis(_resume_for(resume_id, _uid(user_id)), _mode(mode))


@router.get("/recommendations", summary="Ranked jobs for a user (heuristic | ml | hybrid)")
def recommendations(
    user_id: str = Query(...), mode: str = Query("hybrid"), limit: int = Query(20, ge=1, le=100),
    skills: str = Query("", description="Comma separated extra skills"),
    location: Optional[str] = None, experience_years: Optional[float] = None,
    remote_preference: Optional[bool] = None, preferred_job_type: Optional[str] = None,
    resume_id: Optional[str] = None, exclude_seen: bool = False,
):
    uid = _uid(user_id)
    profile = {k: v for k, v in {"location": location, "experience_years": experience_years,
                                 "remote_preference": remote_preference,
                                 "preferred_job_type": preferred_job_type}.items() if v not in (None, "")}
    ref = resume_id
    if ref:
        _resume_for(ref, uid)  # ownership check
    return engines.recommend(uid, _mode(mode), limit, job_store.split_skills(skills), profile,
                             resume_ref=ref, exclude_seen=exclude_seen)


@router.get("/deck", summary="Re-ranked swipe deck: unseen jobs, best first, diversified")
def deck(user_id: str = Query(...), limit: int = Query(30, ge=1, le=100), mode: str = Query("hybrid")):
    return engines.deck(_uid(user_id), limit, _mode(mode))


class CandidateRequest(BaseModel):
    job_id: int
    user_ids: list[int] = Field(default_factory=list, max_length=200)


@router.post("/match/candidates", summary="Recruiter view: score applicants against a job")
def match_candidates(body: CandidateRequest):
    res = engines.candidate_match(body.job_id, body.user_ids)
    if res is None:
        raise HTTPException(404, "Job not found.")
    return {"job_id": body.job_id, "scores": res}


@router.get("/insights/skill-gap", summary="Skills demanded by the jobs you target but missing from your profile")
def insight_skill_gap(user_id: str = Query(...)):
    return insights.skill_gap(_uid(user_id))


@router.get("/insights/recommendations", summary="Why jobs are recommended: interests, swipes, model")
def insight_recommendations(user_id: str = Query(...)):
    return insights.recommendation_insights(_uid(user_id))


@router.get("/engine", summary="Which embedding backend is active")
def engine_info():
    info = embeddings.get_embedder().warmup()
    return {**info, "modes": list(engines.MODES), "hybrid_weights": {"heuristic": engines.HYBRID_W[0],
                                                                    "model": engines.HYBRID_W[1]}}


@router.post("/index/refresh", summary="Force a re-embed of changed jobs")
def refresh_index():
    idx = embeddings.get_index(force=True)
    return {"jobs": len(idx.jobs), "model": idx.model}
