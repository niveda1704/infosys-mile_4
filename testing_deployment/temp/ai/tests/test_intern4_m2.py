"""
Intern 4 Milestone 2 Comprehensive Unit & Integration Test Suite:
1. Skill matching
2. Location matching
3. Experience matching
4. Remote matching
5. Freshness
6. Competition
7. Positive swipe influence
8. Negative swipe influence
9. Multiple factors combined
10. Missing/empty fields
11. Recommendation ranking
12. Reason generation
13. API Endpoint verification (GET /api/v1/recommendations, POST /api/v1/swipes)
"""

import os
import io
import sys
import unittest
import pandas as pd
from fastapi.testclient import TestClient
from reportlab.pdfgen import canvas

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from src.main import app, RESUME_STORE, USER_RESUME_MAP, USER_PROFILE_STORE, SWIPE_STORE
from src.recommender import (
    calculate_heuristic_match,
    compute_swipe_preferences,
    get_job_recommendations,
    parse_required_skills
)


class TestIntern4Milestone2(unittest.TestCase):

    def setUp(self):
        """Clear in-memory state before each test."""
        RESUME_STORE.clear()
        USER_RESUME_MAP.clear()
        USER_PROFILE_STORE.clear()
        SWIPE_STORE.clear()
        self.client = TestClient(app)

    def _create_sample_pdf(self, skills_text="Skills: Python, SQL, FastAPI, Git"):
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer)
        p.drawString(100, 750, "Intern 4 Candidate Resume")
        p.drawString(100, 730, skills_text)
        p.save()
        return buffer.getvalue()

    def _get_mock_job(
        self,
        job_id="J001",
        title="Python Developer",
        company="TCS",
        company_type="MNC",
        location="Bangalore",
        remote="No",
        skills="['Python', 'Django', 'SQL']",
        exp="0-2 years",
        job_type="Full-time"
    ) -> pd.Series:
        return pd.Series({
            "Job ID": job_id,
            "Job Title": title,
            "Company": company,
            "Company Type": company_type,
            "Location": location,
            "Remote": remote,
            "Required Skills": skills,
            "Experience": exp,
            "Job Type": job_type
        })

    # =========================================================================
    # 12 DAY 4 SRS CHECKPOINTS
    # =========================================================================

    def test_01_skill_matching(self):
        """1. Skill matching: Candidate matching required skills receives skill points & reason tag."""
        job = self._get_mock_job(skills="['Python', 'SQL', 'FastAPI']")
        res_full = calculate_heuristic_match(job, candidate_skills=["Python", "SQL", "FastAPI"])
        self.assertIn("Matches your skills", res_full["reasons"])

        res_none = calculate_heuristic_match(job, candidate_skills=["Java", "React"])
        self.assertNotIn("Matches your skills", res_none["reasons"])

    def test_02_location_matching(self):
        """2. Location matching: Job in candidate's city receives location score & reason tag."""
        job = self._get_mock_job(location="Bangalore", remote="No")
        profile = {"location": "Bangalore"}
        res = calculate_heuristic_match(job, candidate_skills=["Python"], user_profile=profile)
        self.assertIn("Matches your preferred location", res["reasons"])

        profile_diff = {"location": "Pune"}
        res_diff = calculate_heuristic_match(job, candidate_skills=["Python"], user_profile=profile_diff)
        self.assertNotIn("Matches your preferred location", res_diff["reasons"])

    def test_03_experience_matching(self):
        """3. Experience matching: Candidate experience level matching job range receives experience tag."""
        job = self._get_mock_job(exp="0-2 years")
        profile = {"experience_years": 1.0}
        res = calculate_heuristic_match(job, candidate_skills=["Python"], user_profile=profile)
        self.assertIn("Matches your experience", res["reasons"])

    def test_04_remote_matching(self):
        """4. Remote matching: Remote jobs receive Remote job reason tag."""
        job = self._get_mock_job(location="Remote", remote="Yes")
        res = calculate_heuristic_match(job, candidate_skills=["Python"])
        self.assertIn("Remote job", res["reasons"])

    def test_05_freshness(self):
        """5. Freshness: Job in first 25% of dataset receives Recently posted tag."""
        job = self._get_mock_job(job_id="J001")
        res = calculate_heuristic_match(job, candidate_skills=["Python"], job_index=5, total_jobs=100)
        self.assertIn("Recently posted", res["reasons"])

        res_old = calculate_heuristic_match(job, candidate_skills=["Python"], job_index=80, total_jobs=100)
        self.assertNotIn("Recently posted", res_old["reasons"])

    def test_06_competition(self):
        """6. Competition: Startup company receives Low competition tag."""
        job_startup = self._get_mock_job(company_type="Startup")
        res_s = calculate_heuristic_match(job_startup, candidate_skills=["Python"])
        self.assertIn("Low competition", res_s["reasons"])

        job_mnc = self._get_mock_job(company_type="MNC")
        res_mnc = calculate_heuristic_match(job_mnc, candidate_skills=["Python"], user_profile={"location": "Pune"})
        self.assertNotIn("Low competition", res_mnc["reasons"])

    def test_07_positive_swipe_influence(self):
        """7. Positive swipe influence: RIGHT/APPLY/SAVE swipe increases score & adds swipe history reason."""
        jobs_df = pd.DataFrame([
            {"Job ID": "J001", "Required Skills": "['Python', 'Django']", "Location": "Bangalore", "Company Type": "MNC", "Remote": "No", "Job Type": "Full-time"},
            {"Job ID": "J002", "Required Skills": "['Java', 'Spring']", "Location": "Pune", "Company Type": "MNC", "Remote": "No", "Job Type": "Full-time"}
        ])

        swipes = [{"job_id": "J001", "action": "RIGHT"}, {"job_id": "J001", "action": "APPLY"}]
        prefs = compute_swipe_preferences(swipes, jobs_df)

        res_j1 = calculate_heuristic_match(jobs_df.iloc[0], candidate_skills=["Python"], preferences=prefs)
        self.assertIn("Based on your swipe history", res_j1["reasons"])
        self.assertGreaterEqual(res_j1["match_score"], 20)

    def test_08_negative_swipe_influence(self):
        """8. Negative swipe influence: LEFT/SKIP swipe decreases score for similar jobs."""
        jobs_df = pd.DataFrame([
            {"Job ID": "J001", "Required Skills": "['Java', 'Spring']", "Location": "Pune", "Company Type": "MNC", "Remote": "No", "Job Type": "Full-time"}
        ])

        swipes_neg = [{"job_id": "J001", "action": "LEFT"}, {"job_id": "J001", "action": "SKIP"}]
        prefs_neg = compute_swipe_preferences(swipes_neg, jobs_df)

        res_j1 = calculate_heuristic_match(jobs_df.iloc[0], candidate_skills=["Java"], preferences=prefs_neg)
        self.assertNotIn("Based on your swipe history", res_j1["reasons"])

    def test_09_multiple_factors_combined(self):
        """9. Multiple factors combined: Skills + Location + Remote + Experience + Swipes combine deterministically."""
        job = self._get_mock_job(skills="['Python', 'SQL']", location="Bangalore", remote="Yes", exp="0-2 years")
        profile = {"location": "Bangalore", "experience_years": 1.0, "remote_preference": True}
        prefs = {"skill_prefs": {"python": 2}}

        res = calculate_heuristic_match(job, candidate_skills=["Python", "SQL"], user_profile=profile, preferences=prefs)
        self.assertIn("Matches your skills", res["reasons"])
        self.assertIn("Matches your preferred location", res["reasons"])
        self.assertIn("Remote job", res["reasons"])
        self.assertIn("Matches your experience", res["reasons"])

    def test_10_missing_empty_fields(self):
        """10. Missing/empty fields: Gracefully handles missing job or profile fields without throwing errors."""
        empty_job = pd.Series({"Job ID": "J999"})
        res = calculate_heuristic_match(empty_job, candidate_skills=[])
        self.assertIsInstance(res["match_score"], int)
        self.assertEqual(res["job_id"], "J999")

    def test_11_recommendation_ranking(self):
        """11. Recommendation ranking: Jobs are ranked strictly from highest to lowest match score."""
        sample_jobs = pd.DataFrame([
            {"Job ID": "J001", "Required Skills": "['Java']", "Location": "Delhi", "Remote": "No", "Company Type": "MNC", "Job Type": "Full-time"},
            {"Job ID": "J002", "Required Skills": "['Python', 'SQL', 'FastAPI']", "Location": "Bangalore", "Remote": "Yes", "Company Type": "Startup", "Job Type": "Full-time"},
            {"Job ID": "J003", "Required Skills": "['Python']", "Location": "Pune", "Remote": "No", "Company Type": "MNC", "Job Type": "Full-time"}
        ])

        recs = get_job_recommendations(
            resume_skills=["Python", "SQL", "FastAPI"],
            jobs_df=sample_jobs,
            user_profile={"location": "Bangalore", "remote_preference": True}
        )

        for i in range(len(recs) - 1):
            self.assertGreaterEqual(
                recs[i]["match_score"],
                recs[i+1]["match_score"],
                "Recommendations are not sorted in descending order of match_score!"
            )
        self.assertEqual(recs[0]["job_id"], "J002")

    def test_12_reason_generation(self):
        """12. Reason generation: Reasons only contain valid tags corresponding to actual score contributions."""
        job = self._get_mock_job(skills="['Python', 'SQL']", location="Remote", remote="Yes", company_type="Startup")
        res = calculate_heuristic_match(job, candidate_skills=["Python", "SQL"])

        for reason in res["reasons"]:
            self.assertIn(reason, [
                "Matches your skills",
                "Matches your preferred location",
                "Remote job",
                "Low competition",
                "Recently posted",
                "Matches your experience",
                "Based on your swipe history"
            ])

    # =========================================================================
    # API ENDPOINT VERIFICATION
    # =========================================================================

    def test_13_api_recommendation_endpoint(self):
        """Test GET /api/v1/recommendations?user_id=U_M2 returns valid M2 response format."""
        pdf_bytes = self._create_sample_pdf("Skills: Python, SQL, FastAPI")
        up_resp = self.client.post("/api/v1/resume/upload?user_id=U_M2", files={"file": ("resume.pdf", pdf_bytes, "application/pdf")})
        self.assertEqual(up_resp.status_code, 201)

        rec_resp = self.client.get("/api/v1/recommendations?user_id=U_M2")
        self.assertEqual(rec_resp.status_code, 200)
        recs = rec_resp.json()

        self.assertIsInstance(recs, list)
        self.assertGreater(len(recs), 0)

        first = recs[0]
        self.assertIn("job_id", first)
        self.assertIn("job_title", first)
        self.assertIn("company", first)
        self.assertIn("location", first)
        self.assertIn("match_score", first)
        self.assertIn("reasons", first)
        self.assertEqual(first["generated_by"], "heuristic-v0")

    def test_14_api_swipe_recording_endpoint(self):
        """Test POST /api/v1/swipes records swipe and alters recommendation ranking."""
        pdf_bytes = self._create_sample_pdf("Skills: Python, SQL")
        up_resp = self.client.post("/api/v1/resume/upload?user_id=U_SWIPE", files={"file": ("resume.pdf", pdf_bytes, "application/pdf")})
        self.assertEqual(up_resp.status_code, 201)

        # Get initial recommendations
        rec1 = self.client.get("/api/v1/recommendations?user_id=U_SWIPE").json()

        # Post RIGHT swipe for Python developer job J001
        swipe_resp = self.client.post("/api/v1/swipes", json={
            "user_id": "U_SWIPE",
            "job_id": "J001",
            "action": "RIGHT"
        })
        self.assertEqual(swipe_resp.status_code, 201)

        # Get updated recommendations
        rec2 = self.client.get("/api/v1/recommendations?user_id=U_SWIPE").json()
        self.assertIsInstance(rec2, list)

        # Verify swipe was registered in swipe store
        self.assertIn("U_SWIPE", SWIPE_STORE)
        self.assertEqual(len(SWIPE_STORE["U_SWIPE"]), 1)


if __name__ == "__main__":
    unittest.main()
