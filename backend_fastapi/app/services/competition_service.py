"""Competition-level and freshness computation."""
from __future__ import annotations

from app.core.config import settings
from app.models.enums import CompetitionLevel
from app.models.job import Job
from app.utils.time import early_window_open, hours_since, is_fresh


def compute_competition_level(applicant_count: int) -> CompetitionLevel:
    if applicant_count <= settings.COMPETITION_LOW_MAX:
        return CompetitionLevel.low
    if applicant_count <= settings.COMPETITION_MEDIUM_MAX:
        return CompetitionLevel.medium
    return CompetitionLevel.high


def recompute_competition(job: Job) -> CompetitionLevel:
    """Apply the current rules and mutate the job's competition_level."""
    level = compute_competition_level(job.applicant_count)
    job.competition_level = level.value
    return level


def freshness(job: Job) -> dict:
    return {
        "is_fresh": is_fresh(job.posted_at, settings.FRESH_JOB_DAYS),
        "is_early_window_open": early_window_open(job.posted_at, settings.EARLY_APPLICANT_WINDOW_HOURS),
        "hours_since_posted": hours_since(job.posted_at),
    }