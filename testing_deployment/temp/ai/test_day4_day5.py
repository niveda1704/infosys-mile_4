import os
import io
import sys
import unittest
from fastapi.testclient import TestClient
from reportlab.pdfgen import canvas

# Ensure src module is importable
sys.path.insert(0, os.path.abspath('.'))

from src.main import app, RESUME_STORE, USER_RESUME_MAP
from src.ats import calculate_ats_score
from src.recommender import get_job_recommendations, parse_required_skills

class TestDay4Day5Deliverables(unittest.TestCase):

    def setUp(self):
        # Clear stores before each test for test isolation
        RESUME_STORE.clear()
        USER_RESUME_MAP.clear()
        self.client = TestClient(app)

    def _create_sample_pdf(self, skills_text="Skills: Python, SQL, FastAPI, Docker"):
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer)
        p.drawString(100, 750, "Test Candidate Resume")
        p.drawString(100, 730, skills_text)
        p.save()
        return buffer.getvalue()

    def test_01_ats_score_unit_calculation(self):
        """Test rule-based ATS match score calculation and missing keywords extraction"""
        resume_skills = ["Python", "SQL", "FastAPI", "Pandas"]
        job_skills = ["Python", "SQL", "TensorFlow", "FastAPI"]

        res = calculate_ats_score(resume_skills, job_skills)
        self.assertEqual(res["match_score"], 75.0)
        self.assertEqual(res["missing_keywords"], ["TensorFlow"])
        self.assertEqual(res["generated_by"], "heuristic-v0")

    def test_02_ats_score_edge_cases(self):
        """Test ATS calculation for empty/no required skills edge cases"""
        # Job has no required skills
        res_no_req = calculate_ats_score(["Python"], [])
        self.assertEqual(res_no_req["match_score"], 100.0)
        self.assertEqual(res_no_req["missing_keywords"], [])

        # Candidate has no skills
        res_no_res = calculate_ats_score([], ["Python", "AWS"])
        self.assertEqual(res_no_res["match_score"], 0.0)
        self.assertEqual(res_no_res["missing_keywords"], ["Python", "AWS"])

    def test_03_ats_endpoint_success_with_real_job(self):
        """Test GET /api/v1/resume/{resume_id}/ats-score?job_id=J001 with uploaded PDF"""
        pdf_bytes = self._create_sample_pdf("Skills: Python, Django, Flask, SQL, Git")
        
        upload_resp = self.client.post(
            "/api/v1/resume/upload",
            files={"file": ("candidate.pdf", pdf_bytes, "application/pdf")}
        )
        self.assertEqual(upload_resp.status_code, 201)
        resume_id = upload_resp.json()["resume_id"]

        # J001 requires ['Python', 'Django', 'Flask', 'SQL', 'Git'] -> 100% match
        ats_resp = self.client.get(f"/api/v1/resume/{resume_id}/ats-score?job_id=J001")
        self.assertEqual(ats_resp.status_code, 200)
        ats_data = ats_resp.json()

        self.assertEqual(ats_data["match_score"], 100.0)
        self.assertEqual(ats_data["missing_keywords"], [])
        self.assertEqual(ats_data["generated_by"], "heuristic-v0")

    def test_04_ats_endpoint_missing_keywords(self):
        """Test ATS endpoint identifies missing required skills from real job J004"""
        # Candidate has Python, SQL, Docker (J004 requires Python, Machine Learning, TensorFlow, PyTorch, SQL)
        pdf_bytes = self._create_sample_pdf("Skills: Python, SQL, Docker")
        
        upload_resp = self.client.post(
            "/api/v1/resume/upload",
            files={"file": ("candidate2.pdf", pdf_bytes, "application/pdf")}
        )
        resume_id = upload_resp.json()["resume_id"]

        ats_resp = self.client.get(f"/api/v1/resume/{resume_id}/ats-score?job_id=J004")
        self.assertEqual(ats_resp.status_code, 200)
        data = ats_resp.json()

        # Matched 2 of 5 required skills (Python, SQL) -> 40% match score
        self.assertEqual(data["match_score"], 40.0)
        self.assertIn("Machine Learning", data["missing_keywords"])
        self.assertIn("TensorFlow", data["missing_keywords"])
        self.assertIn("PyTorch", data["missing_keywords"])
        self.assertEqual(data["generated_by"], "heuristic-v0")

    def test_05_ats_endpoint_invalid_ids(self):
        """Test error handling for non-existent resume_id and non-existent job_id"""
        # Invalid resume_id
        resp_invalid_resume = self.client.get("/api/v1/resume/non-existent-id/ats-score?job_id=J001")
        self.assertEqual(resp_invalid_resume.status_code, 404)

        # Upload valid resume then test invalid job_id
        pdf_bytes = self._create_sample_pdf("Skills: Python, SQL")
        upload_resp = self.client.post(
            "/api/v1/resume/upload",
            files={"file": ("candidate.pdf", pdf_bytes, "application/pdf")}
        )
        resume_id = upload_resp.json()["resume_id"]

        resp_invalid_job = self.client.get(f"/api/v1/resume/{resume_id}/ats-score?job_id=J99999")
        self.assertEqual(resp_invalid_job.status_code, 404)

    def test_06_recommendation_endpoint(self):
        """Test GET /api/v1/recommendations?user_id=U001 return sorted jobs from jobs.csv"""
        pdf_bytes = self._create_sample_pdf("Skills: Java, Spring Boot, SQL, Git, REST API")
        
        # Upload resume associated with user_id U001
        upload_resp = self.client.post(
            "/api/v1/resume/upload?user_id=U001",
            files={"file": ("java_dev.pdf", pdf_bytes, "application/pdf")}
        )
        self.assertEqual(upload_resp.status_code, 201)

        rec_resp = self.client.get("/api/v1/recommendations?user_id=U001")
        self.assertEqual(rec_resp.status_code, 200)
        recs = rec_resp.json()

        self.assertIsInstance(recs, list)
        self.assertGreater(len(recs), 0)

        # Check SRS response contract fields
        first_rec = recs[0]
        self.assertIn("job_id", first_rec)
        self.assertIn("match_percentage", first_rec)
        self.assertEqual(first_rec["generated_by"], "heuristic-v0")

        # Verify sorting: recommendations sorted by match_percentage descending
        for i in range(len(recs) - 1):
            self.assertGreaterEqual(
                recs[i]["match_percentage"],
                recs[i+1]["match_percentage"],
                "Recommendations are not sorted in descending order of match_percentage!"
            )

    def test_07_recommendation_endpoint_no_resume_error(self):
        """Test recommendation endpoint returns 404 when no resume exists for user"""
        resp = self.client.get("/api/v1/recommendations?user_id=UNKNOWN_USER")
        self.assertEqual(resp.status_code, 404)

if __name__ == '__main__':
    unittest.main()
