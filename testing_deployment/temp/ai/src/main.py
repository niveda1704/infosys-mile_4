import os
import uuid
from typing import Optional, Dict
import pandas as pd
from fastapi import FastAPI, File, UploadFile, HTTPException, Query, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from src.ats import calculate_ats_score, calculate_generic_resume_score

from src.parser import extract_text_from_pdf
from src.skills import extract_skills
from src.ats import calculate_ats_score
from src.recommender import get_job_recommendations, parse_required_skills
from src.job_client import get_live_jobs, jobs_to_dataframe

# ============================================================
# CORS
# ============================================================


app = FastAPI(
    title="SwipeX Intern 3 AI/ML Career Intelligence Service",
    description="Resume Parsing, Rule-Based ATS Scoring, and Job Recommendation Service (Milestone 1)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from pydantic import BaseModel, Field

# In-memory storage for uploaded resumes, user mappings, profiles, and swipes
# RESUME_STORE Structure: {resume_id: {"parsed_skills": [...], "raw_text": "...", "user_id": "..."}}
RESUME_STORE: Dict[str, dict] = {}
USER_RESUME_MAP: Dict[str, str] = {} # user_id -> latest resume_id
USER_PROFILE_STORE: Dict[str, dict] = {} # user_id -> profile dict
SWIPE_STORE: Dict[str, list] = {} # user_id -> list of swipe dicts [{"job_id": "J001", "action": "RIGHT"}]


class SwipeRequest(BaseModel):
    user_id: str = Field(..., description="Target User ID")
    job_id: str = Field(..., description="Target Job ID e.g. J001")
    action: str = Field(..., description="Swipe action: RIGHT, LEFT, APPLY, SAVE, SKIP")


class ProfileRequest(BaseModel):
    user_id: str = Field(..., description="User ID")
    location: Optional[str] = None
    experience_years: Optional[float] = None
    remote_preference: Optional[bool] = None
    preferred_job_type: Optional[str] = None

# Helper function to get jobs dataframe
# JOBS_CSV_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "jobs.csv")

def load_jobs_data() -> pd.DataFrame:
    """
    Load live jobs from SwipeX Job Service.
    """

    jobs = get_live_jobs()

    if not jobs:
        return pd.DataFrame()

    return jobs_to_dataframe(jobs)

@app.get("/")
def health_check():
    return {"status": "ok", "service": "intern3-ai-service", "version": "1.0.0"}


@app.get(
    "/api/v1/resume/{resume_id}/analysis",
    status_code=status.HTTP_200_OK,
    summary="Get Job-Agnostic Heuristic Resume Analysis"
)
def get_resume_analysis(resume_id: str):
    """
    Returns a general resume quality score (no job_id required),
    computed heuristically from parsed resume skills.
    """
    if resume_id not in RESUME_STORE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resume with id '{resume_id}' not found."
        )

    resume_skills = RESUME_STORE[resume_id]["parsed_skills"]
    result = calculate_generic_resume_score(resume_skills)
    result["resume_id"] = resume_id

    return JSONResponse(status_code=status.HTTP_200_OK, content=result)


@app.post(
    "/api/v1/resume/upload",
    status_code=status.HTTP_201_CREATED,
    summary="Upload PDF Resume and Extract Skills"
)
async def upload_resume(
    file: UploadFile = File(...),
    user_id: Optional[str] = Query(None, description="Optional user ID to associate with uploaded resume")
):
    """
    Accepts a multipart PDF resume upload, extracts text using pdfplumber,
    extracts skill keywords using a deterministic rule-based extractor,
    and persists the parsed resume skills in memory.
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file uploaded."
        )

    filename = file.filename.lower()
    if not filename.endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PDF files (.pdf) are supported."
        )

    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded PDF file is empty."
            )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error reading file upload: {str(e)}"
        )

    try:
        raw_text = extract_text_from_pdf(content)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unreadable PDF file: {str(e)}"
        )
    parsed_skills = extract_skills(raw_text)
    resume_id = str(uuid.uuid4())

    # Store resume in memory
    RESUME_STORE[resume_id] = {
        "parsed_skills": parsed_skills,
        "raw_text": raw_text,
        "user_id": user_id
    }

    if user_id:
        USER_RESUME_MAP[user_id] = resume_id

    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={
            "resume_id": resume_id,
            "parsed_skills": parsed_skills
        }
    )


@app.get(
    "/api/v1/resume/{resume_id}/ats-score",
    status_code=status.HTTP_200_OK,
    summary="Get Rule-Based ATS Score for a Job"
)
def get_ats_score(resume_id: str, job_id: str = Query(..., description="Target Job ID from jobs.csv")):
    """
    Compares selected resume with selected job from data/jobs.csv using rule-based skill overlap.
    """
    if resume_id not in RESUME_STORE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resume with id '{resume_id}' not found."
        )

    if not job_id or not job_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query parameter 'job_id' is required."
        )

    df = load_jobs_data()
    job_row = df[df["Job ID"].astype(str).str.strip().str.upper() == job_id.strip().upper()]

    if job_row.empty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with id '{job_id}' not found in jobs.csv dataset."
        )

    raw_required_skills = job_row.iloc[0]["Required Skills"]
    job_required_skills = parse_required_skills(raw_required_skills)
    resume_skills = RESUME_STORE[resume_id]["parsed_skills"]

    result = calculate_ats_score(resume_skills, job_required_skills)
    return JSONResponse(status_code=status.HTTP_200_OK, content=result)


@app.post(
    "/api/v1/swipes",
    status_code=status.HTTP_201_CREATED,
    summary="Record User Swipe Action for Preference Learning"
)
def record_swipe(swipe_req: SwipeRequest):
    """
    Records user swipe action (RIGHT, LEFT, APPLY, SAVE, SKIP) to update matching preferences.
    """
    if not swipe_req.user_id or not swipe_req.user_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="user_id is required."
        )

    if not swipe_req.job_id or not swipe_req.job_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="job_id is required."
        )

    action_clean = swipe_req.action.strip().upper()
    valid_actions = {"RIGHT", "LEFT", "LIKE", "DISLIKE", "APPLY", "SAVE", "SKIP"}
    if action_clean not in valid_actions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid action '{swipe_req.action}'. Allowed actions: {sorted(list(valid_actions))}"
        )

    uid = swipe_req.user_id.strip()
    if uid not in SWIPE_STORE:
        SWIPE_STORE[uid] = []

    SWIPE_STORE[uid].append({
        "job_id": swipe_req.job_id.strip(),
        "action": action_clean
    })

    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={
            "status": "recorded",
            "user_id": uid,
            "job_id": swipe_req.job_id.strip(),
            "action": action_clean,
            "total_swipes": len(SWIPE_STORE[uid])
        }
    )


@app.post(
    "/api/v1/user/profile",
    status_code=status.HTTP_200_OK,
    summary="Update User Preference Profile"
)
def update_user_profile(profile_req: ProfileRequest):
    """
    Stores or updates optional user profile preferences (location, experience_years, remote_preference, preferred_job_type).
    """
    if not profile_req.user_id or not profile_req.user_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="user_id is required."
        )

    uid = profile_req.user_id.strip()
    existing = USER_PROFILE_STORE.get(uid, {})

    if profile_req.location is not None:
        existing["location"] = profile_req.location
    if profile_req.experience_years is not None:
        existing["experience_years"] = profile_req.experience_years
    if profile_req.remote_preference is not None:
        existing["remote_preference"] = profile_req.remote_preference
    if profile_req.preferred_job_type is not None:
        existing["preferred_job_type"] = profile_req.preferred_job_type

    USER_PROFILE_STORE[uid] = existing
    return JSONResponse(status_code=status.HTTP_200_OK, content={"status": "profile_updated", "user_id": uid, "profile": existing})


@app.get(
    "/api/v1/recommendations",
    status_code=status.HTTP_200_OK,
    summary="Get Job Recommendations for a Candidate"
)
def get_recommendations(
    user_id: str = Query(..., description="User ID"),
    resume_id: Optional[str] = Query(None, description="Optional Resume ID. Uses user_id mapped resume or latest uploaded resume if omitted.")
):
    """
    Returns list of recommended jobs sorted by match_score (descending) using heuristic scoring.
    """
    if not user_id or not user_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query parameter 'user_id' is required."
        )

    user_id_clean = user_id.strip()
    target_resume_id = resume_id

    if not target_resume_id and user_id_clean in USER_RESUME_MAP:
        target_resume_id = USER_RESUME_MAP[user_id_clean]

    if not target_resume_id and RESUME_STORE:
        # Fallback to the latest uploaded resume if only user_id is provided without prior upload mapping
        target_resume_id = list(RESUME_STORE.keys())[-1]

    # Check if we have candidate skills from resume or candidate profile
    resume_skills = []
    if target_resume_id and target_resume_id in RESUME_STORE:
        resume_skills = RESUME_STORE[target_resume_id]["parsed_skills"]

    user_profile = USER_PROFILE_STORE.get(user_id_clean, {})
    swipes = SWIPE_STORE.get(user_id_clean, [])

    # If user has no uploaded resume AND no user profile stored -> HTTP 404 Not Found
    if not target_resume_id and not user_profile and user_id_clean not in USER_RESUME_MAP and not RESUME_STORE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No uploaded resume found. Please upload a PDF resume first."
        )

    df = load_jobs_data()
    recommendations = get_job_recommendations(
        resume_skills=resume_skills,
        jobs_df=df,
        user_profile=user_profile,
        swipes=swipes
    )
    return JSONResponse(status_code=status.HTTP_200_OK, content=recommendations)


if __name__ == "__main__":
    import uvicorn
    print("=== Starting SwipeX Intern 4 AI FastAPI Service (src/main.py) ===")
    uvicorn.run("src.main:app", host="127.0.0.1", port=8000, reload=True)


