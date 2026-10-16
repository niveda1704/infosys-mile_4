"""Protocol-based AI ports and DTOs.

The backend never imports concrete AI libraries directly; it only depends on
these Protocols. Adapters are selected by AI_MODE in factory.py.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol


# ---------- DTOs ----------

@dataclass
class ExtractedSkill:
    name: str
    normalized_name: str
    category: str | None = None
    confidence: float = 1.0


@dataclass
class ATSResult:
    match_score: float
    keyword_score: float
    semantic_score: float | None = None
    missing_skills: list[str] = field(default_factory=list)
    missing_keywords: list[str] = field(default_factory=list)
    generated_by: str = "heuristic-v0"


@dataclass
class SuggestionResult:
    suggestions: list[str]
    source: str = "rule_based"


@dataclass
class RankedJob:
    job_id: str
    match_score: float
    reason_tags: list[str] = field(default_factory=list)


# ---------- Ports ----------

class ResumeParserPort(Protocol):
    def extract_text(self, data: bytes, content_type: str) -> str: ...
    def extract_skills(self, text: str) -> list[ExtractedSkill]: ...
    def extract_experience(self, text: str) -> list[dict[str, Any]]: ...


class ATSScoringPort(Protocol):
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
    ) -> ATSResult: ...


class SuggestionPort(Protocol):
    def generate(
        self,
        *,
        ats_result: ATSResult,
        resume_text: str,
        job_title: str,
        job_description: str,
    ) -> SuggestionResult: ...


class RecommendationPort(Protocol):
    def rank(
        self,
        *,
        user_ctx: dict[str, Any],
        candidates: list[dict[str, Any]],
        swipe_history: list[dict[str, Any]],
    ) -> list[RankedJob]: ...