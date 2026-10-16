"""Analytics repository — aggregate writes and dashboard queries."""
from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import Date, cast, delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analytics import DailyJobStat, SkillDemandDaily
from app.models.ats import ATSScore
from app.models.company import Company
from app.models.enums import ApplicationStatus
from app.models.job import Job
from app.models.swipe import Application, Swipe
from app.models.user import User, UserProfile


class AnalyticsRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ---------- aggregate refresh ----------
    async def refresh_daily_job_stats(self, *, days: int = 30) -> int:
        """Upsert rows in daily_job_stats for the past `days` days."""
        since = datetime.now(timezone.utc) - timedelta(days=days)
        # jobs posted grouped by (date, company_type)
        job_stmt = (
            select(
                cast(Job.posted_at, Date).label("d"),
                Company.company_type,
                func.count().label("n"),
            )
            .join(Company, Company.id == Job.company_id)
            .where(Job.posted_at >= since)
            .group_by(cast(Job.posted_at, Date), Company.company_type)
        )
        job_rows = (await self.db.execute(job_stmt)).all()

        app_stmt = (
            select(
                cast(Application.created_at, Date).label("d"),
                Company.company_type,
                func.count().label("n"),
            )
            .join(Job, Job.id == Application.job_id)
            .join(Company, Company.id == Job.company_id)
            .where(Application.created_at >= since)
            .group_by(cast(Application.created_at, Date), Company.company_type)
        )
        app_rows = (await self.db.execute(app_stmt)).all()

        merged: dict[tuple[date, str], dict] = {}
        for d, ctype, n in job_rows:
            merged.setdefault((d, ctype), {"jobs_posted": 0, "applications_count": 0})
            merged[(d, ctype)]["jobs_posted"] = int(n)
        for d, ctype, n in app_rows:
            merged.setdefault((d, ctype), {"jobs_posted": 0, "applications_count": 0})
            merged[(d, ctype)]["applications_count"] = int(n)

        # delete and re-insert for the window
        await self.db.execute(
            delete(DailyJobStat).where(DailyJobStat.date >= since.date())
        )
        for (d, ctype), counts in merged.items():
            self.db.add(
                DailyJobStat(
                    date=d,
                    company_type=ctype,
                    jobs_posted=counts["jobs_posted"],
                    applications_count=counts["applications_count"],
                )
            )
        await self.db.flush()
        return len(merged)

    async def refresh_skill_demand(self, *, days: int = 30) -> int:
        since = datetime.now(timezone.utc) - timedelta(days=days)
        stmt = (
            select(Job.skills, cast(Job.posted_at, Date).label("d"))
            .where(Job.posted_at >= since)
        )
        rows = (await self.db.execute(stmt)).all()
        counts: dict[tuple[date, str], int] = {}
        for skills, d in rows:
            for skill in (skills or []):
                key = (d, skill.lower())
                counts[key] = counts.get(key, 0) + 1

        await self.db.execute(
            delete(SkillDemandDaily).where(SkillDemandDaily.date >= since.date())
        )
        for (d, skill), n in counts.items():
            self.db.add(SkillDemandDaily(date=d, skill=skill, job_count=n))
        await self.db.flush()
        return len(counts)

    # ---------- job seeker ----------
    async def application_funnel(self, user_id: uuid.UUID) -> dict[str, int]:
        stmt = (
            select(Application.status, func.count())
            .where(Application.user_id == user_id)
            .group_by(Application.status)
        )
        rows = (await self.db.execute(stmt)).all()
        out = {s.value: 0 for s in ApplicationStatus}
        for status, n in rows:
            out[status] = int(n)
        return out

    async def swipes_by_direction(self, user_id: uuid.UUID) -> dict[str, int]:
        stmt = (
            select(Swipe.direction, func.count())
            .where(Swipe.user_id == user_id)
            .group_by(Swipe.direction)
        )
        rows = (await self.db.execute(stmt)).all()
        out = {"right": 0, "left": 0}
        for direction, n in rows:
            out[direction] = int(n)
        return out

    async def resume_performance(self, user_id: uuid.UUID) -> list[dict]:
        """For each resume version, aggregate the apps + ATS scores it produced."""
        stmt = (
            select(
                ATSScore.resume_version_id,
                func.avg(ATSScore.match_score).label("avg_score"),
                func.count().label("score_count"),
            )
            .where(ATSScore.user_id == user_id)
            .group_by(ATSScore.resume_version_id)
        )
        rows = (await self.db.execute(stmt)).all()

        out: list[dict] = []
        for version_id, avg_score, score_count in rows:
            apps_stmt = (
                select(Application.status, func.count())
                .where(
                    Application.user_id == user_id,
                    Application.resume_version_id == version_id,
                )
                .group_by(Application.status)
            )
            apps_rows = (await self.db.execute(apps_stmt)).all()
            status_counts = {s: int(n) for s, n in apps_rows}
            out.append(
                {
                    "resume_version_id": str(version_id),
                    "avg_ats_score": float(avg_score) if avg_score is not None else None,
                    "scores_count": int(score_count),
                    # every non-bookmark application counts as an apply, including ones
                    # that have since progressed to shortlisted / interview / rejected
                    "applies": sum(n for st, n in status_counts.items() if st != "saved"),
                    "shortlists": status_counts.get("shortlisted", 0),
                    "interviews": status_counts.get("interview", 0),
                    "rejections": status_counts.get("rejected", 0),
                }
            )
        return out

    async def skill_gap(self, user_id: uuid.UUID, *, limit: int = 15) -> list[dict]:
        """Skills demanded by the user's saved/applied jobs and absent from the default resume."""
        # Candidate jobs = any the user has an application (saved/applied/...) or swipe right for
        jobs_from_apps = select(Application.job_id).where(Application.user_id == user_id)
        jobs_from_swipes = select(Swipe.job_id).where(
            Swipe.user_id == user_id, Swipe.direction == "right"
        )

        # User's current skills = profile + default resume version
        profile = (
            await self.db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
        ).scalar_one_or_none()
        user_skills: set[str] = set()
        if profile is not None:
            user_skills |= {s.lower() for s in (profile.skills or [])}

        from app.models.resume import ResumeSkill, ResumeVersion

        default_version = (
            await self.db.execute(
                select(ResumeVersion)
                .where(ResumeVersion.user_id == user_id, ResumeVersion.is_default.is_(True))
            )
        ).scalar_one_or_none()
        if default_version is not None:
            skills = (
                await self.db.execute(
                    select(ResumeSkill.normalized_name).where(
                        ResumeSkill.resume_version_id == default_version.id
                    )
                )
            ).scalars().all()
            user_skills |= {s.lower() for s in skills}

        # Skills demanded by the target jobs
        target_job_ids = set((await self.db.execute(jobs_from_apps)).scalars().all()) | set(
            (await self.db.execute(jobs_from_swipes)).scalars().all()
        )
        if not target_job_ids:
            return []

        demand_stmt = select(Job.required_skills, Job.skills).where(Job.id.in_(target_job_ids))
        demand_rows = (await self.db.execute(demand_stmt)).all()
        counter: dict[str, int] = {}
        for required, skills in demand_rows:
            for s in (required or []) + (skills or []):
                s_norm = s.lower()
                if s_norm not in user_skills:
                    counter[s_norm] = counter.get(s_norm, 0) + 1
        ranked = sorted(counter.items(), key=lambda kv: kv[1], reverse=True)[:limit]
        return [{"skill": s, "count": n} for s, n in ranked]

    async def recommendation_insights(self, user_id: uuid.UUID) -> dict:
        from app.models.ats import RecommendationEvent

        events_stmt = select(RecommendationEvent).where(RecommendationEvent.user_id == user_id)
        events = list((await self.db.execute(events_stmt)).scalars().all())
        avg_score = (
            sum(e.match_score for e in events) / len(events) if events else 0.0
        )
        tag_counter: dict[str, int] = {}
        for e in events:
            for tag in (e.reason_tags or []):
                tag_counter[tag] = tag_counter.get(tag, 0) + 1
        top_tags = sorted(tag_counter.items(), key=lambda kv: kv[1], reverse=True)[:5]

        total_swipes = (
            await self.db.execute(
                select(func.count()).select_from(Swipe).where(Swipe.user_id == user_id)
            )
        ).scalar_one()
        right_swipes = (
            await self.db.execute(
                select(func.count())
                .select_from(Swipe)
                .where(Swipe.user_id == user_id, Swipe.direction == "right")
            )
        ).scalar_one()
        right_rate = (int(right_swipes) / int(total_swipes) * 100.0) if total_swipes else 0.0

        return {
            "avg_match_score": round(avg_score, 2),
            "top_reason_tags": [{"tag": t, "count": n} for t, n in top_tags],
            "right_swipe_rate": round(right_rate, 2),
        }

    # ---------- recruiter ----------
    async def recruiter_overview(self, *, recruiter_id: uuid.UUID) -> dict:
        # Jobs posted by this recruiter
        jobs_stmt = select(Job.id).where(Job.posted_by_id == recruiter_id)
        job_ids = list((await self.db.execute(jobs_stmt)).scalars().all())
        if not job_ids:
            return {
                "applicants_per_job": [],
                "status_funnel": {s.value: 0 for s in ApplicationStatus},
                "applications_over_time": [],
            }

        # Applicants per job
        apps_stmt = (
            select(Application.job_id, func.count())
            .where(
                Application.job_id.in_(job_ids),
                Application.status != ApplicationStatus.saved.value,
            )
            .group_by(Application.job_id)
        )
        rows = (await self.db.execute(apps_stmt)).all()
        title_stmt = select(Job.id, Job.title).where(Job.id.in_(job_ids))
        titles = {jid: title for jid, title in (await self.db.execute(title_stmt)).all()}
        applicants_per_job = [
            {"job_id": str(jid), "title": titles.get(jid), "applicants": int(n)}
            for jid, n in rows
        ]

        # Status funnel for those jobs
        funnel_stmt = (
            select(Application.status, func.count())
            .where(
                Application.job_id.in_(job_ids),
                Application.status != ApplicationStatus.saved.value,
            )
            .group_by(Application.status)
        )
        funnel = {s.value: 0 for s in ApplicationStatus}
        for status, n in (await self.db.execute(funnel_stmt)).all():
            funnel[status] = int(n)

        # Applications over time
        time_stmt = (
            select(cast(Application.created_at, Date).label("d"), func.count())
            .where(
                Application.job_id.in_(job_ids),
                Application.status != ApplicationStatus.saved.value,
            )
            .group_by(cast(Application.created_at, Date))
            .order_by(cast(Application.created_at, Date))
        )
        over_time = [
            {"date": str(d), "count": int(n)}
            for d, n in (await self.db.execute(time_stmt)).all()
        ]
        return {
            "applicants_per_job": applicants_per_job,
            "status_funnel": funnel,
            "applications_over_time": over_time,
        }

    # ---------- admin ----------
    async def admin_overview(self) -> dict:
        users_by_role_stmt = select(User.role, func.count()).group_by(User.role)
        users_by_role = {
            role: int(n) for role, n in (await self.db.execute(users_by_role_stmt)).all()
        }

        active_jobs = (
            await self.db.execute(
                select(func.count()).select_from(Job).where(Job.is_active.is_(True))
            )
        ).scalar_one()

        total_applications = (
            await self.db.execute(select(func.count()).select_from(Application))
        ).scalar_one()

        total_companies = (
            await self.db.execute(select(func.count()).select_from(Company))
        ).scalar_one()

        by_type_stmt = (
            select(Company.company_type, func.count())
            .select_from(Job)
            .join(Company, Company.id == Job.company_id)
            .where(Job.is_active.is_(True))
            .group_by(Company.company_type)
        )
        active_jobs_by_type = {
            t: int(n) for t, n in (await self.db.execute(by_type_stmt)).all()
        }

        return {
            "users_by_role": users_by_role,
            "active_jobs": int(active_jobs),
            "total_applications": int(total_applications),
            "total_companies": int(total_companies),
            "active_jobs_by_company_type": active_jobs_by_type,
        }

    # ---------- hiring trends (all authed) ----------
    async def hiring_trends(
        self, *, from_date: date, to_date: date, granularity: str
    ) -> dict:
        # jobs posted over time
        if granularity == "week":
            bucket = func.date_trunc("week", Job.posted_at)
        else:
            bucket = cast(Job.posted_at, Date)

        stmt = (
            select(bucket.label("bucket"), func.count())
            .where(cast(Job.posted_at, Date) >= from_date, cast(Job.posted_at, Date) <= to_date)
            .group_by(bucket)
            .order_by(bucket)
        )
        jobs_over_time = [
            {"bucket": str(b), "jobs": int(n)} for b, n in (await self.db.execute(stmt)).all()
        ]

        # top in-demand skills in that window
        skill_stmt = (
            select(func.unnest(Job.skills).label("skill"), func.count())
            .where(cast(Job.posted_at, Date) >= from_date, cast(Job.posted_at, Date) <= to_date)
            .group_by("skill")
            .order_by(func.count().desc())
            .limit(10)
        )
        top_skills = [
            {"skill": s, "count": int(n)} for s, n in (await self.db.execute(skill_stmt)).all()
        ]

        # activity by company type
        ctype_stmt = (
            select(Company.company_type, func.count())
            .select_from(Job)
            .join(Company, Company.id == Job.company_id)
            .where(cast(Job.posted_at, Date) >= from_date, cast(Job.posted_at, Date) <= to_date)
            .group_by(Company.company_type)
        )
        activity_by_type = {
            t: int(n) for t, n in (await self.db.execute(ctype_stmt)).all()
        }

        return {
            "from": str(from_date),
            "to": str(to_date),
            "granularity": granularity,
            "jobs_over_time": jobs_over_time,
            "top_skills": top_skills,
            "activity_by_company_type": activity_by_type,
        }

    # ---------- aggregate reads ----------
    async def daily_stats(self, *, days: int = 30) -> list[dict]:
        since = date.today() - timedelta(days=days)
        stmt = (
            select(DailyJobStat)
            .where(DailyJobStat.date >= since)
            .order_by(DailyJobStat.date)
        )
        rows = list((await self.db.execute(stmt)).scalars().all())
        return [
            {
                "date": str(r.date),
                "company_type": r.company_type,
                "jobs_posted": r.jobs_posted,
                "applications_count": r.applications_count,
            }
            for r in rows
        ]

    async def top_skill_demand(self, *, days: int = 30, limit: int = 10) -> list[dict]:
        since = date.today() - timedelta(days=days)
        stmt = (
            select(SkillDemandDaily.skill, func.sum(SkillDemandDaily.job_count))
            .where(SkillDemandDaily.date >= since)
            .group_by(SkillDemandDaily.skill)
            .order_by(func.sum(SkillDemandDaily.job_count).desc())
            .limit(limit)
        )
        return [{"skill": s, "count": int(n)} for s, n in (await self.db.execute(stmt)).all()]