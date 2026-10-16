"""
Day 5 Gateway Integration & Joint Verification Test Suite
Verifies 10 SRS integration checkpoints for Intern 4 Milestone 2:
1. Service start & importability
2. GET /api/v1/recommendations reachable
3. Request forwarding / route handling
4. Response structure correctness
5. match_score present in returned items
6. reasons tag list present
7. Ranking is strictly descending by match_score
8. Invalid user_id handling (HTTP 404)
9. Swipe & profile endpoints operational
10. Backward compatibility with M1 endpoints
"""

import os
import io
import sys
import unittest
from fastapi.testclient import TestClient
from reportlab.pdfgen import canvas

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from src.main import app, RESUME_STORE, USER_RESUME_MAP, USER_PROFILE_STORE, SWIPE_STORE


class TestDay5GatewayIntegration(unittest.TestCase):

    def setUp(self):
        """Reset state before each test."""
        RESUME_STORE.clear()
        USER_RESUME_MAP.clear()
        USER_PROFILE_STORE.clear()
        SWIPE_STORE.clear()
        self.client = TestClient(app)

    def _create_sample_pdf(self, skills_text="Skills: Python, SQL, FastAPI, Git"):
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer)
        p.drawString(100, 750, "Day 5 Gateway Integration Candidate")
        p.drawString(100, 730, skills_text)
        p.save()
        return buffer.getvalue()

    def test_01_service_health_check(self):
        """1. Verify service is running and health endpoint returns ok status."""
        resp = self.client.get("/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["service"], "intern3-ai-service")

    def test_02_recommendation_route_reachable(self):
        """2. Verify GET /api/v1/recommendations is registered and reachable."""
        pdf_bytes = self._create_sample_pdf()
        up_resp = self.client.post("/api/v1/resume/upload?user_id=GW_U1", files={"file": ("res.pdf", pdf_bytes, "application/pdf")})
        self.assertEqual(up_resp.status_code, 201)

        rec_resp = self.client.get("/api/v1/recommendations?user_id=GW_U1")
        self.assertEqual(rec_resp.status_code, 200)

    def test_03_gateway_request_forwarding(self):
        """3. Verify request parameters (user_id, resume_id) are correctly parsed."""
        pdf_bytes = self._create_sample_pdf()
        up_resp = self.client.post("/api/v1/resume/upload", files={"file": ("res.pdf", pdf_bytes, "application/pdf")})
        resume_id = up_resp.json()["resume_id"]

        rec_resp = self.client.get(f"/api/v1/recommendations?user_id=GW_U2&resume_id={resume_id}")
        self.assertEqual(rec_resp.status_code, 200)
        self.assertIsInstance(rec_resp.json(), list)

    def test_04_matching_engine_response_format(self):
        """4. Verify response contract meets SRS requirements."""
        pdf_bytes = self._create_sample_pdf("Skills: Python, Django")
        self.client.post("/api/v1/resume/upload?user_id=GW_U3", files={"file": ("res.pdf", pdf_bytes, "application/pdf")})

        rec_resp = self.client.get("/api/v1/recommendations?user_id=GW_U3")
        self.assertEqual(rec_resp.status_code, 200)
        recs = rec_resp.json()
        self.assertGreater(len(recs), 0)
        first = recs[0]
        self.assertIn("job_id", first)
        self.assertIn("job_title", first)
        self.assertIn("company", first)
        self.assertIn("location", first)

    def test_05_match_score_present(self):
        """5. Verify match_score field is present and bounded (0-100)."""
        pdf_bytes = self._create_sample_pdf()
        self.client.post("/api/v1/resume/upload?user_id=GW_U4", files={"file": ("res.pdf", pdf_bytes, "application/pdf")})

        recs = self.client.get("/api/v1/recommendations?user_id=GW_U4").json()
        for rec in recs:
            self.assertIn("match_score", rec)
            self.assertIsInstance(rec["match_score"], int)
            self.assertGreaterEqual(rec["match_score"], 0)
            self.assertLessEqual(rec["match_score"], 100)

    def test_06_reasons_tags_present(self):
        """6. Verify reasons tag list is present in recommendations."""
        pdf_bytes = self._create_sample_pdf()
        self.client.post("/api/v1/resume/upload?user_id=GW_U5", files={"file": ("res.pdf", pdf_bytes, "application/pdf")})

        recs = self.client.get("/api/v1/recommendations?user_id=GW_U5").json()
        for rec in recs:
            self.assertIn("reasons", rec)
            self.assertIsInstance(rec["reasons"], list)

    def test_07_recommendation_ranking_order(self):
        """7. Verify recommendations are strictly ordered by match_score descending."""
        pdf_bytes = self._create_sample_pdf("Skills: Python, SQL, Docker")
        self.client.post("/api/v1/resume/upload?user_id=GW_U6", files={"file": ("res.pdf", pdf_bytes, "application/pdf")})

        recs = self.client.get("/api/v1/recommendations?user_id=GW_U6").json()
        scores = [r["match_score"] for r in recs]
        for i in range(len(scores) - 1):
            self.assertGreaterEqual(scores[i], scores[i+1], f"Ranking broken at index {i}: {scores[i]} < {scores[i+1]}")

    def test_08_invalid_user_id_handling(self):
        """8. Verify nonexistent user_id returns HTTP 404 when no resume or profile exists."""
        resp = self.client.get("/api/v1/recommendations?user_id=NONEXISTENT_USER_9999")
        self.assertEqual(resp.status_code, 404)
        self.assertIn("no uploaded resume found", resp.json()["detail"].lower())

    def test_09_swipe_and_profile_gateway_endpoints(self):
        """9. Verify POST /api/v1/swipes and POST /api/v1/user/profile endpoints are operational."""
        # 1. Profile
        prof_resp = self.client.post("/api/v1/user/profile", json={
            "user_id": "GW_U7",
            "location": "Bangalore",
            "experience_years": 2.0,
            "remote_preference": True,
            "preferred_job_type": "Full-time"
        })
        self.assertEqual(prof_resp.status_code, 200)

        # 2. Swipe
        swipe_resp = self.client.post("/api/v1/swipes", json={
            "user_id": "GW_U7",
            "job_id": "J001",
            "action": "RIGHT"
        })
        self.assertEqual(swipe_resp.status_code, 201)

        # 3. Recommendations should work using profile without requiring explicit resume upload
        rec_resp = self.client.get("/api/v1/recommendations?user_id=GW_U7")
        self.assertEqual(rec_resp.status_code, 200)

    def test_10_backward_compatibility_m1_endpoints(self):
        """10. Verify M1 ATS scoring endpoint remains fully functional."""
        pdf_bytes = self._create_sample_pdf("Skills: Python, SQL")
        up_resp = self.client.post("/api/v1/resume/upload", files={"file": ("res.pdf", pdf_bytes, "application/pdf")})
        resume_id = up_resp.json()["resume_id"]

        ats_resp = self.client.get(f"/api/v1/resume/{resume_id}/ats-score?job_id=J001")
        self.assertEqual(ats_resp.status_code, 200)
        ats_data = ats_resp.json()
        self.assertIn("match_score", ats_data)
        self.assertIn("missing_keywords", ats_data)
        self.assertEqual(ats_data["generated_by"], "heuristic-v0")


if __name__ == "__main__":
    unittest.main()
