"""Idempotent dev seed for the SwipeX backend.

Creates:
- 1 admin, 3 recruiters, 10 job seekers (documented dev passwords).
- >=25 companies across MNC / startup / newly_founded.
- >=120 jobs with backfilled required_skills + keywords, varied posted_at,
  varied applicant_count so all three competition levels exist.
- ~300 swipes and ~80 applications with status events.
- 2 sample resumes with parsed text + skills for seeded job seekers.
- A handful of ATS scores and notifications with default alert preferences.
- Aggregate refresh at the end.

Safe to run twice.
"""
from __future__ import annotations

import asyncio
import logging
import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.analytics import DailyJobStat, SkillDemandDaily  # noqa: F401  (ensures registration)
from app.models.ats import ATSScore, RecommendationEvent
from app.models.company import Company
from app.models.enums import (
    ApplicationStatus,
    AuthProvider,
    CompanyType,
    ExperienceLevel,
    JobType,
    NotificationChannel,
    NotificationType,
    ParseStatus,
    PortfolioKind,
    SwipeAction,
    SwipeDirection,
    UserRole,
    WorkMode,
)
from app.models.job import Job
from app.models.notification import AlertPreference, Notification
from app.models.resume import Resume, ResumeSkill, ResumeVersion
from app.models.swipe import Application, ApplicationStatusEvent, SavedJob, Swipe
from app.models.user import PortfolioItem, ProfileExperience, User, UserProfile
from app.services.analytics_service import AnalyticsService
from app.services.competition_service import compute_competition_level
from app.utils.slugify import slugify

logger = logging.getLogger("scripts.seed_data")

# ---------------------------------------------------------------------------
# Static dev data
# ---------------------------------------------------------------------------

DEV_ADMIN_EMAIL = "admin@swipex.local"
DEV_RECRUITER_EMAILS = [
    "recruiter1@swipex.local",
    "recruiter2@swipex.local",
    "recruiter3@swipex.local",
]
DEV_SEEKER_EMAILS = [f"seeker{i}@swipex.local" for i in range(1, 11)]
DEV_PASSWORD = "Passw0rd!"

COMPANIES = [
    # ---- MNC ----
    ("Infosys", CompanyType.mnc, "IT Services", "10000+", "Bengaluru", 1981, False),
    ("TCS", CompanyType.mnc, "IT Services", "10000+", "Mumbai", 1968, False),
    ("Wipro", CompanyType.mnc, "IT Services", "10000+", "Bengaluru", 1945, False),
    ("Accenture", CompanyType.mnc, "Consulting", "10000+", "Dublin", 1989, False),
    ("Microsoft", CompanyType.mnc, "Software", "10000+", "Redmond", 1975, False),
    ("Google", CompanyType.mnc, "Software", "10000+", "Mountain View", 1998, False),
    ("Amazon", CompanyType.mnc, "E-commerce", "10000+", "Seattle", 1994, False),
    ("IBM", CompanyType.mnc, "IT Services", "10000+", "Armonk", 1911, False),
    ("Oracle", CompanyType.mnc, "Software", "10000+", "Austin", 1977, False),
    ("SAP", CompanyType.mnc, "Software", "10000+", "Walldorf", 1972, False),
    # ---- Startup ----
    ("Razorpay", CompanyType.startup, "Fintech", "1001-5000", "Bengaluru", 2014, False),
    ("Zerodha", CompanyType.startup, "Fintech", "501-1000", "Bengaluru", 2010, False),
    ("Freshworks", CompanyType.startup, "SaaS", "1001-5000", "Chennai", 2010, False),
    ("Postman", CompanyType.startup, "Developer Tools", "501-1000", "Bengaluru", 2014, False),
    ("Hasura", CompanyType.startup, "Developer Tools", "51-200", "Bengaluru", 2017, False),
    ("Zepto", CompanyType.startup, "Quick Commerce", "1001-5000", "Mumbai", 2021, False),
    ("Meesho", CompanyType.startup, "E-commerce", "1001-5000", "Bengaluru", 2015, False),
    ("Groww", CompanyType.startup, "Fintech", "501-1000", "Bengaluru", 2016, False),
    ("Slice", CompanyType.startup, "Fintech", "201-500", "Bengaluru", 2016, False),
    ("Darwinbox", CompanyType.startup, "HR Tech", "501-1000", "Hyderabad", 2015, False),
    # ---- Newly founded ----
    ("Northstar Labs", CompanyType.newly_founded, "AI", "1-10", "Bengaluru", 2024, True),
    ("Bloom AI", CompanyType.newly_founded, "AI", "11-50", "Pune", 2024, True),
    ("Trailhead", CompanyType.newly_founded, "DevTools", "1-10", "Remote", 2024, True),
    ("Signal Forge", CompanyType.newly_founded, "Data", "11-50", "Hyderabad", 2024, True),
    ("Kernel Works", CompanyType.newly_founded, "Infra", "1-10", "Chennai", 2024, True),
    ("Skyward", CompanyType.newly_founded, "Aerospace", "11-50", "Bengaluru", 2024, True),
    ("Echo Health", CompanyType.newly_founded, "HealthTech", "1-10", "Remote", 2024, True),
    ("Pixelforge", CompanyType.newly_founded, "Design Tools", "11-50", "Mumbai", 2024, True),
]

LOCATIONS = [
    "Bengaluru", "Hyderabad", "Pune", "Mumbai", "Chennai", "Gurugram",
    "Noida", "Kolkata", "Remote", "Delhi NCR",
]

SKILL_POOL = [
    "python", "javascript", "typescript", "java", "go", "rust", "kotlin", "swift",
    "react", "next.js", "vue", "angular", "svelte", "django", "flask", "fastapi",
    "express", "nestjs", "spring", "rails", "postgresql", "mysql", "mongodb", "redis",
    "elasticsearch", "docker", "kubernetes", "terraform", "aws", "gcp", "azure",
    "github actions", "machine learning", "deep learning", "nlp", "pytorch",
    "tensorflow", "scikit-learn", "pandas", "numpy", "spacy", "graphql", "rest",
    "tailwind", "graphql", "websocket", "jwt", "oauth", "microservices",
    "system design", "ci/cd", "tdd", "unit testing", "git", "linux", "agile",
]

TITLES_BY_TYPE = {
    JobType.full_time: [
        "Software Engineer", "Backend Engineer", "Frontend Engineer", "Full Stack Engineer",
        "Data Engineer", "ML Engineer", "DevOps Engineer", "Platform Engineer",
        "Senior Software Engineer", "Staff Engineer", "Site Reliability Engineer",
        "Product Manager", "Engineering Manager",
    ],
    JobType.internship: [
        "Software Engineering Intern", "Data Science Intern", "Product Intern",
        "Design Intern", "Marketing Intern",
    ],
    JobType.contract: [
        "Freelance Backend Developer", "Contract Data Engineer", "Contract React Developer",
    ],
    JobType.part_time: [
        "Part-time QA Engineer", "Part-time Technical Writer",
    ],
}

DESCRIPTIONS = [
    "We are looking for a {title} to join our team. You will build reliable systems, "
    "collaborate with designers and PMs, and ship features end-to-end. "
    "Required: {skills}.",
    "As a {title}, you will own features from design to production. "
    "We work in small, empowered teams. Required skills: {skills}. "
    "You will partner closely with product and design.",
    "Join us as a {title} and help us scale our platform. "
    "Day to day: design APIs, review code, improve reliability. "
    "Stack: {skills}.",
]


def _pick(pool: list, k: int) -> list:
    return random.sample(pool, k=min(k, len(pool)))


def _maybe(val, p: float = 0.5):
    return val if random.random() < p else None


# ---------------------------------------------------------------------------
# Seed steps
# ---------------------------------------------------------------------------

async def _seed_users(db: AsyncSession) -> dict:
    """Return {admin, recruiters, seekers} lists of User rows; idempotent by email."""
    created: dict[str, list[User]] = {"admin": [], "recruiters": [], "seekers": []}

    async def get_or_create(email: str, full_name: str, role: UserRole) -> User:
        existing = (
            await db.execute(select(User).where(func.lower(User.email) == email.lower()))
        ).scalar_one_or_none()
        if existing is not None:
            return existing
        user = User(
            email=email.lower(),
            hashed_password=hash_password(DEV_PASSWORD),
            full_name=full_name,
            role=role.value,
            auth_provider=AuthProvider.local.value,
            is_active=True,
        )
        db.add(user)
        await db.flush()
        return user

    admin = await get_or_create(DEV_ADMIN_EMAIL, "Admin User", UserRole.admin)
    created["admin"].append(admin)

    for i, email in enumerate(DEV_RECRUITER_EMAILS, start=1):
        u = await get_or_create(email, f"Recruiter {i}", UserRole.recruiter)
        created["recruiters"].append(u)

    for i, email in enumerate(DEV_SEEKER_EMAILS, start=1):
        u = await get_or_create(email, f"Job Seeker {i}", UserRole.job_seeker)
        created["seekers"].append(u)

    await db.flush()

    # Profiles for the seekers
    for i, u in enumerate(created["seekers"]):
        prof = (
            await db.execute(select(UserProfile).where(UserProfile.user_id == u.id))
        ).scalar_one_or_none()
        if prof is None:
            prof = UserProfile(user_id=u.id)
            db.add(prof)
            await db.flush()
        if not prof.skills:
            prof.skills = _pick(SKILL_POOL, 6 + (i % 4))
            prof.experience_level = random.choice(
                [ExperienceLevel.fresher.value, ExperienceLevel.junior.value, ExperienceLevel.mid.value]
            )
            prof.years_experience = random.randint(0, 6)
            prof.location = random.choice(LOCATIONS)
            prof.headline = f"{prof.experience_level.title()} engineer"
            prof.bio = "Seeded job seeker profile for dev/demo."
            prof.open_to_remote = True
            prof.preferred_job_types = [
                JobType.full_time.value,
                JobType.internship.value if random.random() < 0.4 else JobType.contract.value,
            ]
            prof.preferred_locations = _pick(LOCATIONS, 2)
            prof.expected_salary_min = 600000 + i * 50000
            prof.expected_salary_max = prof.expected_salary_min + 400000
            await db.flush()

        # A couple of experiences for realism
        existing_exp = (
            await db.execute(
                select(func.count()).select_from(ProfileExperience).where(
                    ProfileExperience.profile_id == prof.id
                )
            )
        ).scalar_one()
        if existing_exp == 0:
            for k in range(random.randint(1, 2)):
                db.add(
                    ProfileExperience(
                        profile_id=prof.id,
                        company_name=random.choice(
                            ["Acme", "Globex", "Initech", "Umbrella", "Stark Industries"]
                        ),
                        title=random.choice(["Engineer", "Senior Engineer", "Analyst"]),
                        start_date=datetime.now(timezone.utc) - timedelta(days=365 * (k + 1)),
                        end_date=None if k == 0 else datetime.now(timezone.utc) - timedelta(days=180 * k),
                        is_current=(k == 0),
                        description="Worked on backend systems and APIs.",
                        location=random.choice(LOCATIONS),
                    )
                )

        # One portfolio item for half the seekers
        existing_pf = (
            await db.execute(
                select(func.count()).select_from(PortfolioItem).where(
                    PortfolioItem.profile_id == prof.id
                )
            )
        ).scalar_one()
        if existing_pf == 0 and random.random() < 0.5:
            db.add(
                PortfolioItem(
                    profile_id=prof.id,
                    title="Personal project",
                    url="https://example.com/project",
                    description="A small project showcasing my skills.",
                    kind=PortfolioKind.project.value,
                )
            )

    # Default alert preferences for every user
    for user in [admin] + created["recruiters"] + created["seekers"]:
        pref = (
            await db.execute(select(AlertPreference).where(AlertPreference.user_id == user.id))
        ).scalar_one_or_none()
        if pref is None:
            db.add(
                AlertPreference(
                    user_id=user.id,
                    enabled_types=[
                        NotificationType.instant_job.value,
                        NotificationType.startup_hiring.value,
                        NotificationType.high_match.value,
                        NotificationType.low_competition.value,
                    ],
                    channels=[NotificationChannel.in_app.value],
                    match_threshold=80,
                    timezone="UTC",
                )
            )

    await db.flush()
    return created


async def _seed_companies(db: AsyncSession, recruiters: list[User]) -> list[Company]:
    out: list[Company] = []
    for idx, (name, ctype, industry, size, hq, founded, newly) in enumerate(COMPANIES):
        existing = (
            await db.execute(select(Company).where(Company.name == name))
        ).scalar_one_or_none()
        if existing is not None:
            out.append(existing)
            continue
        # Round-robin owner among recruiters
        owner = recruiters[idx % len(recruiters)]
        c = Company(
            name=name,
            slug=slugify(name),
            about=f"{name} is a {ctype.value} in {industry}.",
            logo_url=None,
            website=f"https://example.com/{slugify(name)}",
            size_range=size,
            industry=industry,
            company_type=ctype.value,
            is_newly_founded=newly,
            founded_year=founded,
            headquarters=hq,
            owner_user_id=owner.id,
        )
        db.add(c)
        await db.flush()
        out.append(c)
    return out


async def _seed_jobs(
    db: AsyncSession, companies: list[Company], recruiters: list[User], target_count: int = 130
) -> list[Job]:
    existing = int(
        (await db.execute(select(func.count()).select_from(Job))).scalar_one()
    )
    needed = max(0, target_count - existing)
    if needed == 0:
        return list((await db.execute(select(Job))).scalars().all())

    created: list[Job] = []
    now = datetime.now(timezone.utc)

    for i in range(needed):
        company = random.choice(companies)
        # Vary company types: ensure enough "newly_founded" jobs exist
        job_type = random.choices(
            [JobType.full_time, JobType.internship, JobType.contract, JobType.part_time],
            weights=[70, 15, 10, 5],
        )[0]
        title = random.choice(TITLES_BY_TYPE[job_type])
        work_mode = random.choices(
            [WorkMode.remote, WorkMode.hybrid, WorkMode.onsite], weights=[35, 35, 30]
        )[0]

        # skill sampling
        skill_count = random.randint(3, 6)
        skills = _pick(SKILL_POOL, skill_count)
        required_skills = skills[: max(1, skill_count // 2)]
        keywords = _pick(skills + ["api", "scalable", "ownership", "mentoring"], 4)

        exp_level = random.choices(
            [
                ExperienceLevel.fresher,
                ExperienceLevel.junior,
                ExperienceLevel.mid,
                ExperienceLevel.senior,
                ExperienceLevel.lead,
            ],
            weights=[10, 25, 35, 20, 10],
        )[0]
        min_years = {
            ExperienceLevel.fresher: 0,
            ExperienceLevel.junior: 1,
            ExperienceLevel.mid: 3,
            ExperienceLevel.senior: 5,
            ExperienceLevel.lead: 8,
        }[exp_level]

        # salary ranges (INR)
        base = random.choice([400000, 600000, 900000, 1200000, 1800000, 2400000])
        salary_min = base
        salary_max = base + random.choice([200000, 400000, 600000, 800000])

        # posted_at spread: minutes to 30 days
        minutes_ago = random.choice(
            [5, 30, 120, 360, 720, 1440, 2880, 5760, 10080, 21600, 30240, 43200]
        )
        posted_at = now - timedelta(minutes=minutes_ago)

        # applicant_count spread so all competition levels occur
        applicant_count = random.choice(
            [0, 2, 5, 10, 15, 20, 25, 40, 70, 90, 120, 200]
        )
        competition_level = compute_competition_level(applicant_count).value

        description = random.choice(DESCRIPTIONS).format(
            title=title, skills=", ".join(required_skills)
        )

        is_fresher_friendly = exp_level == ExperienceLevel.fresher or min_years == 0

        job = Job(
            company_id=company.id,
            posted_by_id=company.owner_user_id,
            title=title,
            description=description,
            job_type=job_type.value,
            work_mode=work_mode.value,
            is_remote=(work_mode == WorkMode.remote),
            location="Remote" if work_mode == WorkMode.remote else random.choice(LOCATIONS),
            salary_min=salary_min,
            salary_max=salary_max,
            salary_currency="INR",
            experience_level=exp_level.value,
            min_experience_years=min_years,
            skills=skills,
            required_skills=required_skills,
            keywords=keywords,
            tags=[],
            is_fresher_friendly=is_fresher_friendly,
            posted_at=posted_at,
            expires_at=None,
            is_active=True,
            applicant_count=applicant_count,
            competition_level=competition_level,
        )
        db.add(job)
        created.append(job)

    await db.flush()
    return list((await db.execute(select(Job))).scalars().all())


async def _seed_swipes_and_applications(
    db: AsyncSession, seekers: list[User], jobs: list[Job]
) -> None:
    if not jobs:
        return
    existing_swipes = int(
        (await db.execute(select(func.count()).select_from(Swipe))).scalar_one()
    )
    if existing_swipes > 0:
        return  # already seeded

    now = datetime.now(timezone.utc)
    target_swipes = 300
    target_apps = 80
    created_apps = 0

    for i in range(target_swipes):
        seeker = seekers[i % len(seekers)]
        job = jobs[(i * 7) % len(jobs)]

        # avoid duplicate (user, job) pairs
        dupe = (
            await db.execute(
                select(Swipe).where(Swipe.user_id == seeker.id, Swipe.job_id == job.id)
            )
        ).scalar_one_or_none()
        if dupe is not None:
            continue

        direction = random.choices(
            [SwipeDirection.right, SwipeDirection.left], weights=[55, 45]
        )[0]
        action = (
            random.choice([SwipeAction.apply, SwipeAction.save])
            if direction == SwipeDirection.right
            else SwipeAction.skip
        )

        swipe = Swipe(
            user_id=seeker.id,
            job_id=job.id,
            direction=direction.value,
            action=action.value,
            swiped_at=now - timedelta(minutes=random.randint(1, 43200)),
        )
        db.add(swipe)

        if direction == SwipeDirection.right and action == SwipeAction.save:
            # saved_job + saved application
            existing_saved = (
                await db.execute(
                    select(SavedJob).where(SavedJob.user_id == seeker.id, SavedJob.job_id == job.id)
                )
            ).scalar_one_or_none()
            if existing_saved is None:
                db.add(SavedJob(user_id=seeker.id, job_id=job.id))
            app = (
                await db.execute(
                    select(Application).where(
                        Application.user_id == seeker.id, Application.job_id == job.id
                    )
                )
            ).scalar_one_or_none()
            if app is None:
                app = Application(
                    user_id=seeker.id,
                    job_id=job.id,
                    status=ApplicationStatus.saved.value,
                )
                db.add(app)
                await db.flush()
                db.add(
                    ApplicationStatusEvent(
                        application_id=app.id,
                        from_status=None,
                        to_status=ApplicationStatus.saved.value,
                        changed_by_id=seeker.id,
                        note="Saved on swipe",
                    )
                )
                created_apps += 1

        elif direction == SwipeDirection.right and action == SwipeAction.apply:
            app = (
                await db.execute(
                    select(Application).where(
                        Application.user_id == seeker.id, Application.job_id == job.id
                    )
                )
            ).scalar_one_or_none()
            if app is None and created_apps < target_apps:
                is_early = (now - job.posted_at).total_seconds() / 3600.0 <= 48
                app = Application(
                    user_id=seeker.id,
                    job_id=job.id,
                    status=ApplicationStatus.applied.value,
                    is_early_applicant=is_early,
                    applied_at=now - timedelta(hours=random.randint(1, 720)),
                )
                db.add(app)
                await db.flush()
                db.add(
                    ApplicationStatusEvent(
                        application_id=app.id,
                        from_status=None,
                        to_status=ApplicationStatus.applied.value,
                        changed_by_id=seeker.id,
                        note="Applied on swipe",
                    )
                )
                created_apps += 1

                # Occasionally advance to shortlisted / interview / rejected
                if random.random() < 0.35:
                    next_status = random.choices(
                        [
                            ApplicationStatus.shortlisted,
                            ApplicationStatus.rejected,
                        ],
                        weights=[70, 30],
                    )[0]
                    db.add(
                        ApplicationStatusEvent(
                            application_id=app.id,
                            from_status=ApplicationStatus.applied.value,
                            to_status=next_status.value,
                            changed_by_id=None,
                            note="Recruiter action (seeded)",
                        )
                    )
                    app.status = next_status.value

                    if next_status == ApplicationStatus.shortlisted and random.random() < 0.5:
                        db.add(
                            ApplicationStatusEvent(
                                application_id=app.id,
                                from_status=ApplicationStatus.shortlisted.value,
                                to_status=ApplicationStatus.interview.value,
                                changed_by_id=None,
                                note="Recruiter action (seeded)",
                            )
                        )
                        app.status = ApplicationStatus.interview.value

    await db.flush()


async def _seed_resumes(db: AsyncSession, seekers: list[User]) -> None:
    """Create one resume per first two seekers with parsed skills."""
    if len(seekers) < 2:
        return
    for idx, seeker in enumerate(seekers[:2]):
        existing = (
            await db.execute(select(Resume).where(Resume.user_id == seeker.id))
        ).scalar_one_or_none()
        if existing is not None:
            continue

        resume = Resume(user_id=seeker.id, title=f"{seeker.full_name}'s Resume")
        db.add(resume)
        await db.flush()

        parsed_text = (
            f"{seeker.full_name}\n"
            "Skills: " + ", ".join(_pick(SKILL_POOL, 8)) + "\n"
            "Experience:\n"
            "Senior Engineer, Example Corp, 2020 - 2023\n"
            "Junior Engineer, Another Co, 2018 - 2020\n"
        )
        version = ResumeVersion(
            resume_id=resume.id,
            user_id=seeker.id,
            version_number=1,
            original_filename=f"seeker{idx + 1}.pdf",
            content_type="application/pdf",
            file_size_bytes=len(parsed_text.encode("utf-8")),
            storage_key=f"resumes/{seeker.id}/seed{idx + 1}.pdf",
            checksum_sha256="0" * 64,
            parsed_text=parsed_text,
            parsed_experience={
                "items": [
                    {
                        "title": "Senior Engineer",
                        "company": "Example Corp",
                        "start": "2020",
                        "end": "2023",
                    }
                ]
            },
            parse_status=ParseStatus.parsed.value,
            parse_error=None,
            is_default=True,
        )
        db.add(version)
        await db.flush()

        # Extract skills from the curated dictionary
        from app.services.skills import extract_skills as _extract

        for entry, confidence in _extract(parsed_text):
            db.add(
                ResumeSkill(
                    resume_version_id=version.id,
                    skill_name=entry.normalized,
                    normalized_name=entry.normalized,
                    category=entry.category,
                    confidence=confidence,
                )
            )
        await db.flush()


async def _seed_ats_and_notifications(db: AsyncSession) -> None:
    # A few ATS scores for the two seeded resumes against a handful of jobs
    resumes = list((await db.execute(select(Resume))).scalars().all())
    jobs = list((await db.execute(select(Job).limit(10))).scalars().all())
    if not resumes or not jobs:
        return

    existing = int((await db.execute(select(func.count()).select_from(ATSScore))).scalar_one())
    if existing > 0:
        return

    for resume in resumes[:2]:
        version = (
            await db.execute(
                select(ResumeVersion).where(
                    ResumeVersion.resume_id == resume.id, ResumeVersion.is_default.is_(True)
                )
            )
        ).scalar_one_or_none()
        if version is None:
            continue
        for job in random.sample(jobs, k=min(3, len(jobs))):
            match = round(random.uniform(40, 95), 2)
            kw = round(random.uniform(30, 95), 2)
            missing_skills = [] if match >= 80 else list(job.required_skills or [])
            missing_keywords = [] if match >= 80 else list(job.keywords or [])
            db.add(
                ATSScore(
                    user_id=resume.user_id,
                    resume_version_id=version.id,
                    job_id=job.id,
                    match_score=match,
                    keyword_score=kw,
                    semantic_score=None,
                    missing_skills=missing_skills,
                    missing_keywords=missing_keywords,
                    suggestions=[],
                    suggestion_source="rule_based",
                    generated_by="heuristic-v0",
                )
            )

    # One recommendation event per seeded seeker
    for user in (await db.execute(select(User).where(User.role == UserRole.job_seeker.value))).scalars().all():
        job = random.choice(jobs)
        db.add(
            RecommendationEvent(
                user_id=user.id,
                job_id=job.id,
                match_score=round(random.uniform(50, 95), 2),
                reason_tags=["Matches your skills"],
                generated_by="heuristic-v0",
            )
        )

    # A welcome notification for each seeded seeker
    for user in (await db.execute(select(User).where(User.role == UserRole.job_seeker.value))).scalars().all():
        db.add(
            Notification(
                user_id=user.id,
                type=NotificationType.system.value,
                title="Welcome to SwipeX",
                body="Start swiping to discover jobs tailored to you.",
                payload={},
                dedupe_key=f"welcome:{user.id}",
            )
        )
    await db.flush()


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

async def seed_all() -> None:
    if settings.ENVIRONMENT == "production" and not settings.ALLOW_PRODUCTION_SEED:
        raise RuntimeError(
            "Refusing to seed in production: seeding creates demo accounts with known "
            "passwords. Set ALLOW_PRODUCTION_SEED=true only if you really intend this."
        )
    async with SessionLocal() as db:
        # 1. Users + profiles + preferences
        users = await _seed_users(db)
        await db.commit()

        # 2. Companies
        companies = await _seed_companies(db, users["recruiters"])
        await db.commit()
        logger.info("Seeded %d companies", len(companies))

        # 3. Jobs
        jobs = await _seed_jobs(db, companies, users["recruiters"])
        await db.commit()
        logger.info("Jobs total after seed: %d", len(jobs))

        # 4. Swipes + applications + events
        await _seed_swipes_and_applications(db, users["seekers"], jobs)
        await db.commit()

        # 5. Resumes + skills
        await _seed_resumes(db, users["seekers"])
        await db.commit()

        # 6. ATS + notifications + preferences (preferences already in _seed_users)
        await _seed_ats_and_notifications(db)
        await db.commit()

        # 7. Aggregates
        try:
            await AnalyticsService(db).refresh_aggregates(days=30)
            await db.commit()
        except Exception as exc:  # noqa: BLE001
            logger.warning("Aggregate refresh failed: %s", exc)

        logger.info("Seed complete.")


if __name__ == "__main__":  # pragma: no cover
    logging.basicConfig(level=logging.INFO)
    asyncio.run(seed_all())