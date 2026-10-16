"""Deterministic, offline heuristic AI adapter — always works."""
from __future__ import annotations

import logging
import re
from typing import Any

from app.integrations.ai.ports import (
    ATSResult,
    ExtractedSkill,
    RankedJob,
    SuggestionResult,
)
from app.services import resume_parser
from app.services.skills import extract_skills as _extract_skills_dict

logger = logging.getLogger(__name__)


def _tokenize(text: str) -> set[str]:
    if not text:
        return set()
    tokens = re.findall(r"[A-Za-z][A-Za-z0-9+#./\-]{1,40}", text.lower())
    stop = {
        "the", "and", "for", "with", "you", "are", "our", "will", "have", "this",
        "that", "from", "your", "their", "them", "they", "any", "all", "not", "but",
        "can", "may", "use", "using", "a", "an", "of", "to", "in", "on", "at", "by",
        "or", "as", "is", "be", "it", "we", "us", "if", "so", "do", "does", "job",
        "role", "team", "work", "working", "experience", "years", "year", "must",
        "should", "would", "could", "well", "good", "strong",
    }
    return {t for t in tokens if t not in stop and len(t) > 1}


class LocalHeuristicAdapter:
    """Fully deterministic, network-free AI adapter."""

    name = "local-heuristic"

    # ---------- parser ----------
    def extract_text(self, data: bytes, content_type: str) -> str:
        return resume_parser.extract_text(data, content_type)

    def extract_skills(self, text: str) -> list[ExtractedSkill]:
        return [
            ExtractedSkill(
                name=entry.normalized,
                normalized_name=entry.normalized,
                category=entry.category,
                confidence=confidence,
            )
            for entry, confidence in _extract_skills_dict(text)
        ]

    def extract_experience(self, text: str) -> list[dict[str, Any]]:
        return resume_parser.extract_experience(text)

    # ---------- ATS ----------
    def score(
        self,
        *,
        resume_text: str,
        resume_skills: list[str],
        job_title: str,
        job_description: str,
        required_skills: list[str],
        keywords: list[str],
        skill_categories: dict[str, str] | None = None,
    ) -> ATSResult:
        resume_skill_set = {s.lower() for s in resume_skills}
        required_lower = [s.lower() for s in required_skills]
        keyword_lower = [k.lower() for k in keywords]

        matched_required = [s for s in required_lower if s in resume_skill_set]
        matched_keywords = [k for k in keyword_lower if k in resume_skill_set]

        # If the job has no required skills, fall back to keyword-only scoring
        if required_lower:
            keyword_score = (len(matched_required) / len(required_lower)) * 100.0
        elif keyword_lower:
            keyword_score = (len(matched_keywords) / len(keyword_lower)) * 100.0
        else:
            # No structured data at all — compare token overlap against the JD
            jd_tokens = _tokenize(job_title + " " + job_description)
            resume_tokens = _tokenize(resume_text)
            if not jd_tokens:
                keyword_score = 0.0
            else:
                overlap = jd_tokens & resume_tokens
                keyword_score = (len(overlap) / len(jd_tokens)) * 100.0

        # Semantic score is not computed locally — deterministic stub.
        semantic_score: float | None = None

        # Blend: keyword only when no semantic
        final = keyword_score

        missing_skills: list[str] = []
        missing_keywords: list[str] = []
        if final < 80.0:
            missing_skills = [s for s in required_lower if s not in resume_skill_set]
            missing_keywords = [k for k in keyword_lower if k not in resume_skill_set]

        return ATSResult(
            match_score=round(final, 2),
            keyword_score=round(keyword_score, 2),
            semantic_score=semantic_score,
            missing_skills=missing_skills,
            missing_keywords=missing_keywords,
            generated_by="heuristic-v0",
        )

    # ---------- Suggestions ----------
    def generate(
        self,
        *,
        ats_result: ATSResult,
        resume_text: str,
        job_title: str,
        job_description: str,
    ) -> SuggestionResult:
        out: list[str] = []
        if ats_result.missing_skills:
            top = ", ".join(ats_result.missing_skills[:6])
            out.append(
                f"Add a Skills section that lists these in-demand skills for this role: {top}."
            )
        if ats_result.missing_keywords:
            top = ", ".join(ats_result.missing_keywords[:6])
            out.append(
                f"Mirror these keywords from the job description where they honestly apply: {top}."
            )
        if ats_result.match_score < 60:
            out.append(
                "Tailor your summary line at the top of the resume to name the target role "
                f"({job_title}) and 2-3 of your strongest relevant skills."
            )
        if "quantif" not in resume_text.lower() and not re.search(r"\d+\s*%", resume_text):
            out.append(
                "Quantify at least 3 achievements (e.g., 'reduced latency by 35%', "
                "'led a team of 4', 'grew users 2x')."
            )
        if len(resume_text) < 1200:
            out.append(
                "Your resume is quite short. Expand the experience bullets with context "
                "(problem → action → result) so ATS parsers have more surface area."
            )
        if not out:
            out.append(
                "Your resume already matches this job closely. Focus on polishing bullet "
                "formatting and keeping each line under 2 rows for scanability."
            )
        return SuggestionResult(suggestions=out, source="rule_based")

    # ---------- Recommendations ----------
    def rank(
        self,
        *,
        user_ctx: dict[str, Any],
        candidates: list[dict[str, Any]],
        swipe_history: list[dict[str, Any]],
    ) -> list[RankedJob]:
        user_skills = {s.lower() for s in (user_ctx.get("skills") or [])}
        user_location = (user_ctx.get("location") or "").lower()
        user_level = (user_ctx.get("experience_level") or "").lower()
        user_years = user_ctx.get("years_experience") or 0

        liked_skills: set[str] = set()
        skipped_skills: set[str] = set()
        for h in swipe_history:
            job_skills = {s.lower() for s in (h.get("job_skills") or [])}
            if h.get("direction") == "right":
                liked_skills |= job_skills
            elif h.get("direction") == "left":
                skipped_skills |= job_skills

        ranked: list[RankedJob] = []
        for c in candidates:
            job_skills = {s.lower() for s in (c.get("skills") or [])}
            required = {s.lower() for s in (c.get("required_skills") or [])}

            skill_overlap = len(user_skills & job_skills)
            required_overlap = len(user_skills & required)
            skill_score = min(1.0, (skill_overlap + required_overlap * 2) / 8.0)

            location_score = 0.0
            job_loc = (c.get("location") or "").lower()
            if user_location and job_loc and (
                user_location in job_loc or job_loc in user_location
            ):
                location_score = 1.0
            elif c.get("is_remote"):
                location_score = 0.7

            exp_score = 0.5
            if user_level:
                levels = ["fresher", "junior", "mid", "senior", "lead"]
                jl = (c.get("experience_level") or "").lower()
                if jl == user_level:
                    exp_score = 1.0
                elif jl in levels and user_level in levels:
                    delta = abs(levels.index(jl) - levels.index(user_level))
                    exp_score = max(0.0, 1.0 - 0.25 * delta)

            freshness_score = 1.0 if c.get("is_fresh") else 0.4
            competition_score = 1.0 if c.get("competition_level") == "low" else (
                0.6 if c.get("competition_level") == "medium" else 0.3
            )

            liked_bonus = 0.15 if (job_skills & liked_skills) else 0.0
            skipped_penalty = 0.2 if (job_skills & skipped_skills) else 0.0

            raw = (
                0.45 * skill_score
                + 0.15 * location_score
                + 0.15 * exp_score
                + 0.10 * freshness_score
                + 0.15 * competition_score
                + liked_bonus
                - skipped_penalty
            )
            match = max(0.0, min(1.0, raw)) * 100.0

            tags: list[str] = []
            if required_overlap > 0 or skill_overlap > 0:
                tags.append("Matches your skills")
            if c.get("competition_level") == "low":
                tags.append("Low competition")
            if c.get("is_fresh"):
                tags.append("Recently posted")
            if c.get("is_remote") and user_ctx.get("open_to_remote"):
                tags.append("Remote-friendly")
            if liked_bonus:
                tags.append("Similar to jobs you liked")

            ranked.append(
                RankedJob(
                    job_id=str(c.get("id")),
                    match_score=round(match, 2),
                    reason_tags=tags or ["Suggested for you"],
                )
            )

        ranked.sort(key=lambda r: r.match_score, reverse=True)
        return ranked