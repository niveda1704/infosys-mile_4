"""Remote HTTP adapter — talks to Intern 4's AI service; falls back to local."""
from __future__ import annotations

import logging
from typing import Any

import httpx
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from app.core.config import settings
from app.integrations.ai.local_adapter import LocalHeuristicAdapter
from app.integrations.ai.ports import (
    ATSResult,
    ExtractedSkill,
    RankedJob,
    SuggestionResult,
)

logger = logging.getLogger(__name__)


class RemoteHttpAdapter:
    """Calls the remote AI service via httpx with retries and falls back
    to the LocalHeuristicAdapter on any failure."""

    name = "remote-http"

    def __init__(self, base_url: str, timeout: float) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self._local = LocalHeuristicAdapter()

    @staticmethod
    def _headers() -> dict[str, str]:
        key = settings.AI_SERVICE_API_KEY
        return {"X-Internal-Api-Key": key} if key else {}

    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=0.2, min=0.2, max=1.0),
        retry=retry_if_exception_type((httpx.HTTPError,)),
        reraise=True,
    )
    def _post(self, path: str, payload: dict) -> dict:
        url = f"{self.base_url}{path}"
        with httpx.Client(timeout=self.timeout, headers=self._headers()) as client:
            resp = client.post(url, json=payload)
            resp.raise_for_status()
            return resp.json()

    # ---------- parser ----------
    def extract_text(self, data: bytes, content_type: str) -> str:
        try:
            # multipart form for file
            url = f"{self.base_url}/parse/text"
            with httpx.Client(timeout=self.timeout, headers=self._headers()) as client:
                resp = client.post(
                    url,
                    files={"file": ("resume", data, content_type)},
                )
                resp.raise_for_status()
                return resp.json().get("text", "")
        except Exception as exc:  # noqa: BLE001
            logger.warning("remote extract_text failed, falling back: %s", exc)
            return self._local.extract_text(data, content_type)

    def extract_skills(self, text: str) -> list[ExtractedSkill]:
        try:
            data = self._post("/parse/skills", {"text": text})
            return [
                ExtractedSkill(
                    name=item["name"],
                    normalized_name=item["normalized_name"],
                    category=item.get("category"),
                    confidence=item.get("confidence", 1.0),
                )
                for item in data.get("skills", [])
            ]
        except Exception as exc:  # noqa: BLE001
            logger.warning("remote extract_skills failed, falling back: %s", exc)
            return self._local.extract_skills(text)

    def extract_experience(self, text: str) -> list[dict[str, Any]]:
        try:
            data = self._post("/parse/experience", {"text": text})
            return list(data.get("items", []))
        except Exception as exc:  # noqa: BLE001
            logger.warning("remote extract_experience failed, falling back: %s", exc)
            return self._local.extract_experience(text)

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
        try:
            data = self._post(
                "/ats/score",
                {
                    "resume_text": resume_text,
                    "resume_skills": resume_skills,
                    "job_title": job_title,
                    "job_description": job_description,
                    "required_skills": required_skills,
                    "keywords": keywords,
                    "skill_categories": skill_categories or {},
                },
            )
            return ATSResult(
                match_score=float(data["match_score"]),
                keyword_score=float(data.get("keyword_score", data["match_score"])),
                semantic_score=(
                    float(data["semantic_score"])
                    if data.get("semantic_score") is not None
                    else None
                ),
                missing_skills=list(data.get("missing_skills", [])),
                missing_keywords=list(data.get("missing_keywords", [])),
                generated_by=data.get("generated_by", "remote-v1"),
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("remote ATS failed, falling back: %s", exc)
            return self._local.score(
                resume_text=resume_text,
                resume_skills=resume_skills,
                job_title=job_title,
                job_description=job_description,
                required_skills=required_skills,
                keywords=keywords,
                skill_categories=skill_categories,
            )

    # ---------- suggestions ----------
    def generate(
        self,
        *,
        ats_result: ATSResult,
        resume_text: str,
        job_title: str,
        job_description: str,
    ) -> SuggestionResult:
        try:
            data = self._post(
                "/ats/suggestions",
                {
                    "match_score": ats_result.match_score,
                    "keyword_score": ats_result.keyword_score,
                    "semantic_score": ats_result.semantic_score,
                    "missing_skills": ats_result.missing_skills,
                    "missing_keywords": ats_result.missing_keywords,
                    "resume_text": resume_text,
                    "job_title": job_title,
                    "job_description": job_description,
                },
            )
            return SuggestionResult(
                suggestions=list(data.get("suggestions", [])),
                source=data.get("source", "llm"),
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("remote suggestions failed, falling back: %s", exc)
            return self._local.generate(
                ats_result=ats_result,
                resume_text=resume_text,
                job_title=job_title,
                job_description=job_description,
            )

    # ---------- recommendations ----------
    def rank(
        self,
        *,
        user_ctx: dict[str, Any],
        candidates: list[dict[str, Any]],
        swipe_history: list[dict[str, Any]],
    ) -> list[RankedJob]:
        try:
            data = self._post(
                "/recommendations/rank",
                {
                    "user_ctx": user_ctx,
                    "candidates": candidates,
                    "swipe_history": swipe_history,
                },
            )
            return [
                RankedJob(
                    job_id=str(item["job_id"]),
                    match_score=float(item["match_score"]),
                    reason_tags=list(item.get("reason_tags", [])),
                )
                for item in data.get("ranked", [])
            ]
        except Exception as exc:  # noqa: BLE001
            logger.warning("remote recommendations failed, falling back: %s", exc)
            return self._local.rank(
                user_ctx=user_ctx,
                candidates=candidates,
                swipe_history=swipe_history,
            )