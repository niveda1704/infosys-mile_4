"""Phase 1 smoke test: app boots and /health responds."""
from __future__ import annotations

from httpx import ASGITransport, AsyncClient

from app.main import app


async def test_health_ok() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert "X-Request-ID" in resp.headers