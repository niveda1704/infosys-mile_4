"""Domain enums shared across models, schemas, and services."""
from __future__ import annotations

import enum


class UserRole(str, enum.Enum):
    job_seeker = "job_seeker"
    recruiter = "recruiter"
    admin = "admin"


class AuthProvider(str, enum.Enum):
    local = "local"
    google = "google"


class CompanyType(str, enum.Enum):
    mnc = "mnc"
    startup = "startup"
    newly_founded = "newly_founded"


class JobType(str, enum.Enum):
    full_time = "full_time"
    internship = "internship"
    contract = "contract"
    part_time = "part_time"


class WorkMode(str, enum.Enum):
    onsite = "onsite"
    hybrid = "hybrid"
    remote = "remote"


class ExperienceLevel(str, enum.Enum):
    fresher = "fresher"
    junior = "junior"
    mid = "mid"
    senior = "senior"
    lead = "lead"


class CompetitionLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class SwipeDirection(str, enum.Enum):
    right = "right"
    left = "left"


class SwipeAction(str, enum.Enum):
    apply = "apply"
    save = "save"
    skip = "skip"


class ApplicationStatus(str, enum.Enum):
    saved = "saved"
    applied = "applied"
    shortlisted = "shortlisted"
    interview = "interview"
    rejected = "rejected"


class ParseStatus(str, enum.Enum):
    pending = "pending"
    parsed = "parsed"
    failed = "failed"


class SuggestionSource(str, enum.Enum):
    llm = "llm"
    rule_based = "rule_based"


class NotificationType(str, enum.Enum):
    instant_job = "instant_job"
    startup_hiring = "startup_hiring"
    high_match = "high_match"
    low_competition = "low_competition"
    application_status = "application_status"
    system = "system"


class NotificationChannel(str, enum.Enum):
    in_app = "in_app"
    email = "email"
    push = "push"


class PortfolioKind(str, enum.Enum):
    github = "github"
    website = "website"
    project = "project"
    other = "other"


class DeliveryStatus(str, enum.Enum):
    sent = "sent"
    failed = "failed"
    skipped = "skipped"