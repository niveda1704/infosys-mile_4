"""
Heuristic Recommendation Engine for SwipeX Intern 4 AI/ML Career Intelligence Service.
Ranks jobs based on rule-based heuristic scoring without embeddings or machine learning models.
Supports multi-factor scoring, swipe-based preference learning, and human-readable reason tags.
"""

import ast
from typing import List, Dict, Optional, Any
import pandas as pd
from src.ats import calculate_ats_score


def parse_required_skills(skills_entry) -> List[str]:
    """
    Parse required skills string from jobs.csv into a clean list of strings.
    """
    if pd.isna(skills_entry) or not skills_entry:
        return []
    
    if isinstance(skills_entry, list):
        return [str(s).strip() for s in skills_entry if s]
        
    skills_str = str(skills_entry).strip()
    if skills_str.startswith('[') and skills_str.endswith(']'):
        try:
            parsed = ast.literal_eval(skills_str)
            if isinstance(parsed, list):
                return [str(s).strip() for s in parsed if s]
        except Exception:
            pass
            
    # Fallback to comma separation
    return [s.strip().strip("'\"") for s in skills_str.strip("[]").split(",") if s.strip()]


def compute_swipe_preferences(swipes: List[Dict[str, Any]], jobs_df: pd.DataFrame) -> Dict[str, Any]:
    """
    Compute preference weights for skills, locations, job types, and remote work
    based on historical swipe actions (RIGHT/APPLY/SAVE vs LEFT/SKIP).
    """
    skill_prefs: Dict[str, int] = {}
    loc_prefs: Dict[str, int] = {}
    type_prefs: Dict[str, int] = {}
    remote_pref: int = 0

    if not swipes or jobs_df is None or jobs_df.empty:
        return {
            "skill_prefs": skill_prefs,
            "loc_prefs": loc_prefs,
            "type_prefs": type_prefs,
            "remote_pref": remote_pref
        }

    # Index jobs by job_id for fast lookup
    job_map = {}
    for _, row in jobs_df.iterrows():
        jid = str(row.get('Job ID', '')).strip().upper()
        if jid:
            job_map[jid] = row

    for swipe in swipes:
        job_id = str(swipe.get("job_id", "")).strip().upper()
        action = str(swipe.get("action", "")).strip().upper()

        if job_id not in job_map:
            continue

        job_row = job_map[job_id]
        multiplier = 1 if action in ["RIGHT", "LIKE", "APPLY", "SAVE"] else (-1 if action in ["LEFT", "SKIP", "DISLIKE"] else 0)
        if multiplier == 0:
            continue

        # 1. Skill preference updates
        raw_skills = job_row.get('Required Skills', '')
        job_skills = parse_required_skills(raw_skills)
        for s in job_skills:
            sk_lower = s.lower()
            skill_prefs[sk_lower] = skill_prefs.get(sk_lower, 0) + multiplier

        # 2. Location preference updates
        loc = str(job_row.get('Location', '')).strip().lower()
        if loc:
            loc_prefs[loc] = loc_prefs.get(loc, 0) + multiplier

        # 3. Job Type preference updates
        jtype = str(job_row.get('Job Type', '')).strip().lower()
        if jtype:
            type_prefs[jtype] = type_prefs.get(jtype, 0) + multiplier

        # 4. Remote preference updates
        is_remote = str(job_row.get('Remote', '')).strip().lower() in ['yes', 'true', '1'] or loc == 'remote'
        if is_remote:
            remote_pref += multiplier

    return {
        "skill_prefs": skill_prefs,
        "loc_prefs": loc_prefs,
        "type_prefs": type_prefs,
        "remote_pref": remote_pref
    }


def calculate_heuristic_match(
    job_row: pd.Series,
    candidate_skills: List[str],
    user_profile: Optional[Dict[str, Any]] = None,
    preferences: Optional[Dict[str, Any]] = None,
    job_index: int = 0,
    total_jobs: int = 200
) -> Dict[str, Any]:
    """
    Calculate explainable heuristic match score and generate reason tags for a job.
    """
    user_profile = user_profile or {}
    preferences = preferences or {}

    raw_skills = job_row.get('Required Skills', '')
    job_required_skills = parse_required_skills(raw_skills)
    job_id = str(job_row.get('Job ID', '')).strip()
    job_title = str(job_row.get('Job Title', '')).strip()
    company = str(job_row.get('Company', '')).strip()
    location = str(job_row.get('Location', '')).strip()
    remote_flag = str(job_row.get('Remote', '')).strip()
    experience_req = str(job_row.get('Experience', '')).strip()
    company_type = str(job_row.get('Company Type', '')).strip()
    job_type = str(job_row.get('Job Type', '')).strip()

    reasons = []

    # Calculate ATS Skill Overlap
    if not job_required_skills:
        raw_ats_score = 100.0
        matched_skills = []
        missing_skills = []
    else:
        ats_res = calculate_ats_score(candidate_skills, job_required_skills)
        raw_ats_score = float(ats_res["match_score"])
        c_skills_lower = {s.lower() for s in candidate_skills}
        matched_skills = [s for s in job_required_skills if s.lower() in c_skills_lower]
        missing_skills = [s for s in job_required_skills if s.lower() not in c_skills_lower]

    if len(matched_skills) >= 2 or (job_required_skills and len(matched_skills) / len(job_required_skills) >= 0.5):
        reasons.append("Matches your skills")

    # Check if multi-factor candidate profile or swipe preferences are active
    has_profile = bool(
        user_profile.get('location') or 
        user_profile.get('experience_years') is not None or 
        user_profile.get('remote_preference') is not None or 
        user_profile.get('preferred_job_type')
    )
    has_swipes = bool(
        preferences.get('skill_prefs') or 
        preferences.get('loc_prefs') or 
        preferences.get('type_prefs') or 
        preferences.get('remote_pref')
    )

    if not has_profile and not has_swipes:
        # Base Skill-Only Mode (Backwards compatible with M1 ATS score)
        final_score = int(round(raw_ats_score))
        
        # Add basic context reason tags if applicable
        job_loc_lower = location.lower()
        is_job_remote = remote_flag.lower() in ['yes', 'true', '1'] or job_loc_lower == 'remote'
        if is_job_remote and "Remote job" not in reasons:
            reasons.append("Remote job")
        if total_jobs > 0 and (job_index / total_jobs) <= 0.25 and "Recently posted" not in reasons:
            reasons.append("Recently posted")
        if company_type.lower() == 'startup' and "Low competition" not in reasons:
            reasons.append("Low competition")

        return {
            "job_id": job_id,
            "job_title": job_title,
            "company": company,
            "location": location,
            "match_score": final_score,
            "match_percentage": float(final_score),
            "matching_skills": matched_skills,
            "missing_skills": missing_skills,
            "reasons": reasons,
            "recommendationReason": "; ".join(reasons) if reasons else None,
            "generated_by": "heuristic-v0"
        }

    # Full Multi-Factor Heuristic Mode
    # 1. Skill Match Component (Max 45 points)
    skill_score = (raw_ats_score / 100.0) * 45.0

    # 2. Location & Remote Component (Max 20 points)
    user_loc = str(user_profile.get('location', '')).strip().lower()
    user_remote_pref = bool(user_profile.get('remote_preference', False))
    job_loc_lower = location.lower()
    is_job_remote = remote_flag.lower() in ['yes', 'true', '1'] or job_loc_lower == 'remote'

    location_score = 0.0
    if user_loc and user_loc == job_loc_lower and job_loc_lower != 'remote':
        location_score += 20.0
        if "Matches your preferred location" not in reasons:
            reasons.append("Matches your preferred location")

    if is_job_remote:
        if (user_remote_pref or user_loc == 'remote'):
            location_score += 20.0
        else:
            location_score += 15.0
        if "Remote job" not in reasons:
            reasons.append("Remote job")

    location_score = min(20.0, location_score)

    # 3. Experience Match Component (Max 15 points)
    user_exp = user_profile.get('experience_years', None)
    experience_score = 0.0
    if user_exp is not None:
        if "0-1" in experience_req or "0-2" in experience_req:
            if user_exp <= 2:
                experience_score = 15.0
                reasons.append("Matches your experience")
            else:
                experience_score = 8.0
        elif "1-3" in experience_req:
            if 1 <= user_exp <= 3:
                experience_score = 15.0
                reasons.append("Matches your experience")
            else:
                experience_score = 8.0
        elif "2-4" in experience_req:
            if 2 <= user_exp <= 4:
                experience_score = 15.0
                reasons.append("Matches your experience")
            else:
                experience_score = 8.0

    # 4. Job Type Component (Max 10 points)
    user_job_type = str(user_profile.get('preferred_job_type', '')).strip().lower()
    job_type_score = 0.0
    if user_job_type:
        if user_job_type == job_type.lower():
            job_type_score = 10.0

    # 5. Freshness & Competition Bonus (Max 10 points)
    freshness_score = 0.0
    if total_jobs > 0 and (job_index / total_jobs) <= 0.25:
        freshness_score += 5.0
        if "Recently posted" not in reasons:
            reasons.append("Recently posted")

    if company_type.lower() == 'startup':
        freshness_score += 5.0
        if "Low competition" not in reasons:
            reasons.append("Low competition")

    # 6. Swipe Preference Adjustment (-15 to +15 points)
    skill_prefs = preferences.get('skill_prefs', {})
    loc_prefs = preferences.get('loc_prefs', {})
    type_prefs = preferences.get('type_prefs', {})
    remote_pref = preferences.get('remote_pref', 0)

    swipe_adj = 0.0
    for s in job_required_skills:
        p_val = skill_prefs.get(s.lower(), 0)
        if p_val > 0:
            swipe_adj += min(p_val * 3.0, 6.0)
        elif p_val < 0:
            swipe_adj += max(p_val * 3.0, -6.0)

    if job_loc_lower in loc_prefs:
        p_loc = loc_prefs[job_loc_lower]
        if p_loc > 0:
            swipe_adj += min(p_loc * 4.0, 6.0)
        elif p_loc < 0:
            swipe_adj += max(p_loc * 4.0, -6.0)

    if is_job_remote and remote_pref != 0:
        if remote_pref > 0:
            swipe_adj += min(remote_pref * 3.0, 5.0)
        else:
            swipe_adj += max(remote_pref * 3.0, -5.0)

    if job_type.lower() in type_prefs:
        p_type = type_prefs[job_type.lower()]
        if p_type > 0:
            swipe_adj += min(p_type * 3.0, 5.0)
        elif p_type < 0:
            swipe_adj += max(p_type * 3.0, -5.0)

    swipe_adj = max(-15.0, min(15.0, swipe_adj))
    if swipe_adj >= 3.0:
        reasons.append("Based on your swipe history")

    raw_total = skill_score + location_score + experience_score + job_type_score + freshness_score + swipe_adj
    final_score = int(round(max(0.0, min(100.0, raw_total))))

    return {
        "job_id": job_id,
        "job_title": job_title,
        "company": company,
        "location": location,
        "match_score": final_score,
        "match_percentage": float(final_score),
        "matching_skills": matched_skills,
        "missing_skills": missing_skills,
        "reasons": reasons,
        "recommendationReason": "; ".join(reasons) if reasons else None,
        "generated_by": "heuristic-v0"
    }



def get_job_recommendations(
    resume_skills: List[str],
    jobs_df: pd.DataFrame,
    user_profile: Optional[Dict[str, Any]] = None,
    swipes: Optional[List[Dict[str, Any]]] = None
) -> List[Dict[str, Any]]:
    """
    Generate job recommendations sorted by match score (descending).
    
    :param resume_skills: Candidate's extracted skills.
    :param jobs_df: pandas DataFrame containing job records from jobs.csv.
    :param user_profile: Optional dict containing location, experience_years, remote_preference, preferred_job_type.
    :param swipes: Optional list of past swipe dicts [{"job_id": "J001", "action": "RIGHT"}].
    :return: List of dicts matching SRS contract:
             [{"job_id": "J001", "job_title": "...", "company": "...", "location": "...", "match_score": 87,
               "matching_skills": [...], "missing_skills": [...], "reasons": [...], "generated_by": "heuristic-v0"}]
    """
    recommendations = []

    if jobs_df is None or jobs_df.empty:
        return recommendations

    preferences = compute_swipe_preferences(swipes or [], jobs_df)
    total_jobs = len(jobs_df)

    for idx, row in jobs_df.iterrows():
        rec_item = calculate_heuristic_match(
            job_row=row,
            candidate_skills=resume_skills,
            user_profile=user_profile,
            preferences=preferences,
            job_index=idx,
            total_jobs=total_jobs
        )
        recommendations.append(rec_item)

    # Sort by match_score descending, then by job_id ascending for deterministic order
    recommendations.sort(key=lambda x: (-x["match_score"], x["job_id"]))

    return recommendations


if __name__ == "__main__":
    print("=== SwipeX Job Recommendation Engine (src/recommender.py) ===")
    sample_raw = "Python, SQL, Machine Learning; Deep Learning"
    parsed = parse_required_skills(sample_raw)
    print(f"Raw Job Skills String: '{sample_raw}'")
    print(f"Parsed Skills List: {parsed}")