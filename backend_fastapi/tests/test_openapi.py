"""OpenAPI sanity: every Section 8 endpoint is present and documented."""
from __future__ import annotations

import pytest


EXPECTED_PATHS = [
    "/api/v1/auth/register",
    "/api/v1/auth/login",
    "/api/v1/auth/token",
    "/api/v1/auth/refresh",
    "/api/v1/auth/logout",
    "/api/v1/auth/me",
    "/api/v1/auth/oauth/google",
    "/api/v1/auth/oauth/google/callback",
    "/api/v1/users/me",
    "/api/v1/users/me/profile",
    "/api/v1/users/me/profile/experiences",
    "/api/v1/users/me/profile/portfolio",
    "/api/v1/companies",
    "/api/v1/jobs",
    "/api/v1/jobs/search",
    "/api/v1/jobs/mine",
    "/api/v1/swipes",
    "/api/v1/swipes/history",
    "/api/v1/swipes/last",
    "/api/v1/saved-jobs",
    "/api/v1/resumes/upload",
    "/api/v1/resumes",
    "/api/v1/ats/score",
    "/api/v1/ats/suggestions",
    "/api/v1/ats/scores",
    "/api/v1/recommendations",
    "/api/v1/applications",
    "/api/v1/applications/board",
    "/api/v1/notifications",
    "/api/v1/notifications/unread-count",
    "/api/v1/notifications/read-all",
    "/api/v1/notifications/preferences",
    "/api/v1/notifications/device-tokens",
    "/api/v1/analytics/job-seeker",
    "/api/v1/analytics/recruiter",
    "/api/v1/analytics/admin",
    "/api/v1/analytics/hiring-trends",
    "/api/v1/admin/users",
    "/api/v1/admin/analytics/refresh",
    "/api/v1/admin/jobs/recompute-competition",
    "/api/v1/health",
    "/api/v1/ready",
]


@pytest.mark.asyncio
async def test_openapi_contains_all_expected_paths(client):
    r = await client.get("/openapi.json")
    assert r.status_code == 200
    paths = set(r.json().get("paths", {}).keys())
    missing = [p for p in EXPECTED_PATHS if p not in paths]
    assert not missing, f"Missing OpenAPI paths: {missing}"


@pytest.mark.asyncio
async def test_every_operation_has_summary_and_tags(client):
    r = await client.get("/openapi.json")
    spec = r.json()
    for path, ops in spec["paths"].items():
        for method, op in ops.items():
            if method not in ("get", "post", "put", "patch", "delete"):
                continue
            assert op.get("summary"), f"{method.upper()} {path} missing summary"
            assert op.get("tags"), f"{method.upper()} {path} missing tags"