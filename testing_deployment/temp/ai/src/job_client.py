import os
import requests
from fastapi import HTTPException
import pandas as pd


JOB_SERVICE_URL = os.getenv(
    "JOB_SERVICE_URL",
    "http://127.0.0.1:5002/api/v1"
)


def get_live_jobs():
    """
    Fetch live jobs from SwipeX Job Service.
    """

    url = f"{JOB_SERVICE_URL}/jobs/"

    try:
        response = requests.get(
            url,
            timeout=10
        )

        response.raise_for_status()

        data = response.json()

        if not data.get("success"):
            raise HTTPException(
                status_code=502,
                detail="Job Service returned unsuccessful response"
            )

        return data.get("jobs", [])

    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=503,
            detail=f"Unable to connect to Job Service: {str(e)}"
        )
        



def jobs_to_dataframe(jobs):
    """
    Convert SwipeX Job Service response
    into the DataFrame format expected by
    the current recommendation engine.
    """

    converted = []

    for job in jobs:

        skills = job.get("skills") or ""

        if isinstance(skills, list):
            skills = ", ".join(skills)

        work_mode = str(
            job.get("work_mode") or ""
        ).strip()

        converted.append({
            "Job ID": str(job.get("id")),
            "Job Title": job.get("title") or "",
            "Company": job.get("company") or "",
            "Required Skills": skills,
            "Location": job.get("location") or "",
            "Remote": (
                "yes"
                if work_mode.lower() == "remote"
                else "no"
            ),
            "Experience": job.get("experience_level") or "",
            "Company Type": "",
            "Job Type": job.get("employment_type") or "",
        })

    return pd.DataFrame(converted)