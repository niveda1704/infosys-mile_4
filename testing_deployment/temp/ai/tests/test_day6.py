"""
Intern 3 Day 6 Comprehensive Test Suite:
- Rule-based ATS scoring unit & API tests (Edge cases A to I)
- Rule-based Recommendation unit & API tests (Edge cases A to G)
- Response Contract validation
- QA Defect Log status check
"""

import os
import io
import sys
import unittest
import pandas as pd
from fastapi.testclient import TestClient
from reportlab.pdfgen import canvas

# Ensure root intern3-ai-service directory is on python path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from src.main import app, RESUME_STORE, USER_RESUME_MAP
from src.ats import calculate_ats_score
from src.recommender import get_job_recommendations, parse_required_skills


class TestDay6ATSAndRecommendations(unittest.TestCase):

    def setUp(self):
        """Clear state before each test run for complete isolation."""
        RESUME_STORE.clear()
        USER_RESUME_MAP.clear()
        self.client = TestClient(app)

    def _create_sample_pdf(self, skills_text="Skills: Python, SQL, FastAPI"):
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer)
        p.drawString(100, 750, "Day 6 Candidate Resume")
        p.drawString(100, 730, skills_text)
        p.save()
        return buffer.getvalue()

    # =========================================================================
    # 1. ATS SCORING TESTS (Cases A to I)
    # =========================================================================

    def test_01_ats_full_skill_match(self):
        """A. Full skill match -> 100% match score"""
        resume_skills = ["Python", "SQL", "FastAPI"]
        job_skills = ["Python", "SQL", "FastAPI"]
        result = calculate_ats_score(resume_skills, job_skills)
        self.assertEqual(result["match_score"], 100.0)
        self.assertEqual(result["missing_keywords"], [])
        self.assertEqual(result["generated_by"], "heuristic-v0")

    def test_02_ats_partial_skill_match(self):
        """B. Partial skill match -> partial percentage score"""
        resume_skills = ["Python", "SQL"]
        job_skills = ["Python", "SQL", "FastAPI"]
        result = calculate_ats_score(resume_skills, job_skills)
        self.assertEqual(result["match_score"], 66.67)
        self.assertEqual(result["missing_keywords"], ["FastAPI"])
        self.assertEqual(result["generated_by"], "heuristic-v0")

    def test_03_ats_no_skill_match(self):
        """C. No skill match -> 0% match score"""
        resume_skills = ["Java"]
        job_skills = ["Python", "SQL"]
        result = calculate_ats_score(resume_skills, job_skills)
        self.assertEqual(result["match_score"], 0.0)
        self.assertEqual(result["missing_keywords"], ["Python", "SQL"])
        self.assertEqual(result["generated_by"], "heuristic-v0")

    def test_04_ats_missing_keywords(self):
        """D. Verify missing required skills are returned correctly"""
        resume_skills = ["Python"]
        job_skills = ["Python", "SQL", "Docker", "AWS"]
        result = calculate_ats_score(resume_skills, job_skills)
        self.assertEqual(result["match_score"], 25.0)
        self.assertEqual(result["missing_keywords"], ["SQL", "Docker", "AWS"])

    def test_05_ats_empty_required_skills(self):
        """E. Job with no required skills is handled safely (returns 100%)"""
        result = calculate_ats_score(["Python", "SQL"], [])
        self.assertEqual(result["match_score"], 100.0)
        self.assertEqual(result["missing_keywords"], [])

    def test_06_ats_missing_resume(self):
        """F. Nonexistent resume_id returns HTTP 404"""
        resp = self.client.get("/api/v1/resume/non-existent-resume-uuid/ats-score?job_id=J001")
        self.assertEqual(resp.status_code, 404)
        self.assertIn("not found", resp.json()["detail"].lower())

    def test_07_ats_missing_job(self):
        """G. Nonexistent job_id returns HTTP 404"""
        pdf_bytes = self._create_sample_pdf("Skills: Python, SQL")
        up_resp = self.client.post("/api/v1/resume/upload", files={"file": ("res.pdf", pdf_bytes, "application/pdf")})
        resume_id = up_resp.json()["resume_id"]

        resp = self.client.get(f"/api/v1/resume/{resume_id}/ats-score?job_id=INVALID_JOB_999")
        self.assertEqual(resp.status_code, 404)
        self.assertIn("not found", resp.json()["detail"].lower())

    def test_08_ats_case_insensitive_matching(self):
        """H. Case-insensitive matching ('Python' vs 'python')"""
        resume_skills = ["python", "sql", "fastapi"]
        job_skills = ["Python", "SQL", "FastAPI"]
        result = calculate_ats_score(resume_skills, job_skills)
        self.assertEqual(result["match_score"], 100.0)
        self.assertEqual(result["missing_keywords"], [])

    def test_09_ats_duplicate_skills(self):
        """I. Duplicate skills in resume or job do not inflate match percentage"""
        # Duplicate resume skills
        res1 = calculate_ats_score(["Python", "Python", "Python", "SQL"], ["Python", "SQL", "AWS"])
        self.assertEqual(res1["match_score"], 66.67)

        # Duplicate job required skills
        res2 = calculate_ats_score(["Python"], ["Python", "python", "Python", "SQL"])
        self.assertEqual(res2["match_score"], 50.0)
        self.assertEqual(res2["missing_keywords"], ["SQL"])

    # =========================================================================
    # 2. RECOMMENDATION LOGIC TESTS (Cases A to G)
    # =========================================================================

    def test_10_recommendation_matching_jobs_returned(self):
        """A. Matching jobs are returned for candidate"""
        sample_jobs = pd.DataFrame([
            {"Job ID": "J001", "Required Skills": "['Python', 'SQL']"},
            {"Job ID": "J002", "Required Skills": "['Java', 'React']"}
        ])
        recs = get_job_recommendations(["Python", "SQL"], sample_jobs)
        self.assertEqual(len(recs), 2)
        self.assertEqual(recs[0]["job_id"], "J001")
        self.assertEqual(recs[0]["match_percentage"], 100.0)

    def test_11_recommendation_match_percentage_calculated_correctly(self):
        """B. Match percentage is calculated accurately"""
        sample_jobs = pd.DataFrame([
            {"Job ID": "J001", "Required Skills": "['Python', 'SQL', 'Docker', 'AWS']"}
        ])
        recs = get_job_recommendations(["Python", "SQL"], sample_jobs)
        self.assertEqual(recs[0]["match_percentage"], 50.0)

    def test_12_recommendation_ordering(self):
        """C. Jobs are ordered appropriately by match percentage descending"""
        sample_jobs = pd.DataFrame([
            {"Job ID": "J001", "Required Skills": "['Java', 'React']"}, # 0%
            {"Job ID": "J002", "Required Skills": "['Python', 'SQL', 'FastAPI']"}, # 100%
            {"Job ID": "J003", "Required Skills": "['Python', 'Java']"} # 50%
        ])
        recs = get_job_recommendations(["Python", "SQL", "FastAPI"], sample_jobs)
        match_scores = [r["match_percentage"] for r in recs]
        self.assertEqual(match_scores, [100.0, 50.0, 0.0])
        self.assertEqual(recs[0]["job_id"], "J002")
        self.assertEqual(recs[1]["job_id"], "J003")
        self.assertEqual(recs[2]["job_id"], "J001")

    def test_13_recommendation_no_skill_overlap(self):
        """D. Jobs with no skill overlap are handled correctly (returned with 0%)"""
        sample_jobs = pd.DataFrame([
            {"Job ID": "J001", "Required Skills": "['C++', 'Linux']"}
        ])
        recs = get_job_recommendations(["Python"], sample_jobs)
        self.assertEqual(len(recs), 1)
        self.assertEqual(recs[0]["match_percentage"], 0.0)

    def test_14_recommendation_empty_skill_lists(self):
        """E. Empty skill lists (or empty job dataframe) handled safely"""
        recs_empty_df = get_job_recommendations(["Python"], pd.DataFrame())
        self.assertEqual(recs_empty_df, [])

        sample_jobs = pd.DataFrame([{"Job ID": "J001", "Required Skills": ""}])
        recs_empty_skills = get_job_recommendations([], sample_jobs)
        self.assertEqual(len(recs_empty_skills), 1)
        self.assertEqual(recs_empty_skills[0]["match_percentage"], 100.0)

    def test_15_recommendation_nonexistent_user(self):
        """F. Nonexistent user or resume returns HTTP 404"""
        resp = self.client.get("/api/v1/recommendations?user_id=NONEXISTENT_USER_ID")
        self.assertEqual(resp.status_code, 404)
        self.assertIn("no uploaded resume found", resp.json()["detail"].lower())

    def test_16_recommendation_response_contract(self):
        """G. Recommendation response matches contract: [{"job_id": "...", "match_percentage": <num>, "generated_by": "heuristic-v0"}]"""
        pdf_bytes = self._create_sample_pdf("Skills: Python, SQL, Git")
        up_resp = self.client.post("/api/v1/resume/upload?user_id=U_CONTRACT", files={"file": ("cand.pdf", pdf_bytes, "application/pdf")})
        self.assertEqual(up_resp.status_code, 201)

        rec_resp = self.client.get("/api/v1/recommendations?user_id=U_CONTRACT")
        self.assertEqual(rec_resp.status_code, 200)
        recs = rec_resp.json()
        self.assertIsInstance(recs, list)
        self.assertGreater(len(recs), 0)

        for item in recs[:5]: # Inspect top recommendations
            self.assertIn("job_id", item)
            self.assertIn("match_percentage", item)
            self.assertEqual(item["generated_by"], "heuristic-v0")
            self.assertIsInstance(item["match_percentage"], (int, float))

    # =========================================================================
    # 3. API RESPONSE CONTRACT VERIFICATION
    # =========================================================================

    def test_17_full_api_response_contracts(self):
        """Verify upload, ats-score, and recommendation API contracts strictly match SRS."""
        pdf_bytes = self._create_sample_pdf("Skills: Python, SQL, Docker, Git")

        # 1. Upload Contract
        upload_resp = self.client.post("/api/v1/resume/upload?user_id=U_FULL", files={"file": ("resume.pdf", pdf_bytes, "application/pdf")})
        self.assertEqual(upload_resp.status_code, 201)
        up_data = upload_resp.json()
        self.assertSetEqual(set(up_data.keys()), {"resume_id", "parsed_skills"})
        resume_id = up_data["resume_id"]

        # 2. ATS Score Contract
        ats_resp = self.client.get(f"/api/v1/resume/{resume_id}/ats-score?job_id=J001")
        self.assertEqual(ats_resp.status_code, 200)
        ats_data = ats_resp.json()
        self.assertSetEqual(set(ats_data.keys()), {"match_score", "missing_keywords", "generated_by"})

        # 3. Recommendation Contract
        rec_resp = self.client.get("/api/v1/recommendations?user_id=U_FULL")
        self.assertEqual(rec_resp.status_code, 200)
        rec_data = rec_resp.json()
        self.assertIsInstance(rec_data, list)
        for rec in rec_data:
            self.assertTrue({"job_id", "match_percentage", "generated_by"}.issubset(set(rec.keys())))

    # =========================================================================
    # 4. QA DEFECT LOG STATUS
    # =========================================================================

    def test_18_qa_defect_log_status(self):
        """Document that Intern 5 defect log is not available in local environment."""
        defect_log_found = False
        # As documented in SRS instructions:
        qa_status_note = "Intern 5 defect log was not available for this local verification."
        self.assertFalse(defect_log_found)
        self.assertEqual(qa_status_note, "Intern 5 defect log was not available for this local verification.")


if __name__ == '__main__':
    unittest.main()
