import os
import io
import sys
import unittest
from fastapi.testclient import TestClient
from reportlab.pdfgen import canvas

# Ensure src module is importable
sys.path.insert(0, os.path.abspath('.'))

from src.main import app
from src.parser import extract_text_from_pdf
from src.skills import extract_skills

class TestDay2Day3Deliverables(unittest.TestCase):

    def test_01_dataset_placement_and_structure(self):
        """Verify data/jobs.csv exists and has 200 records x 11 columns"""
        jobs_path = os.path.join('data', 'jobs.csv')
        old_path = os.path.join('data', 'Jobtrain.csv')
        
        self.assertTrue(os.path.exists(jobs_path), f"File {jobs_path} does not exist.")
        self.assertFalse(os.path.exists(old_path), f"Old file {old_path} should have been moved.")
        
        import pandas as pd
        df = pd.read_csv(jobs_path)
        self.assertGreaterEqual(df.shape[0], 200, f"Expected at least 200 rows, got {df.shape[0]}")
        self.assertEqual(df.shape[1], 11, f"Expected 11 columns, got {df.shape[1]}")
        
        expected_cols = [
            'Job ID', 'Job Title', 'Company', 'Company Type', 'Location',
            'Remote', 'Required Skills', 'Experience', 'Salary', 'Job Type',
            'Job Description'
        ]
        self.assertEqual(list(df.columns), expected_cols)

    def test_02_eda_notebook_and_report(self):
        """Verify eda.ipynb and EDA_REPORT.md existence and contents"""
        nb_path = os.path.join('notebooks', 'eda.ipynb')
        report_path = 'EDA_REPORT.md'
        
        self.assertTrue(os.path.exists(nb_path), f"Notebook {nb_path} missing.")
        self.assertTrue(os.path.exists(report_path), f"Report {report_path} missing.")
        
        with open(report_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        required_sections = [
            "1. Dataset Overview", "2. Data Quality", "3. Job Role Analysis",
            "4. Company Analysis", "5. Location and Remote Analysis",
            "6. Job Type Analysis", "7. Experience Analysis", "8. Salary Analysis",
            "9. Required Skills Analysis", "10. Job Description Analysis",
            "11. Resume Sample Analysis", "12. Key Findings", "13. Confirmed Features"
        ]
        for section in required_sections:
            self.assertIn(section, content, f"Missing section '{section}' in EDA_REPORT.md")

    def test_03_pdf_parser_and_skill_extractor(self):
        """Test pdfplumber parser and rule-based skill extractor using an in-memory PDF"""
        # Create a test PDF in memory using ReportLab
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer)
        p.drawString(100, 750, "John Doe Resume")
        p.drawString(100, 730, "Experienced Software Engineer skilled in Python, SQL, Git, and Docker.")
        p.drawString(100, 710, "Built Machine Learning applications using PyTorch and React.")
        p.save()
        pdf_bytes = buffer.getvalue()

        # Test Parser
        parsed_text = extract_text_from_pdf(pdf_bytes)
        self.assertIn("Python", parsed_text)
        self.assertIn("John Doe", parsed_text)

        # Test Skill Extractor
        skills = extract_skills(parsed_text)
        expected_skills = ["Docker", "Git", "Machine Learning", "PyTorch", "Python", "React", "SQL"]
        for skill in expected_skills:
            self.assertIn(skill, skills, f"Skill '{skill}' not extracted")

    def test_04_resume_upload_endpoint_success(self):
        """Test POST /api/v1/resume/upload with a valid PDF"""
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer)
        p.drawString(100, 750, "Jane Smith Resume")
        p.drawString(100, 730, "Skills: Java, AWS, Python, Linux, Communication")
        p.save()
        pdf_bytes = buffer.getvalue()

        client = TestClient(app)
        response = client.post(
            "/api/v1/resume/upload",
            files={"file": ("jane_smith_resume.pdf", pdf_bytes, "application/pdf")}
        )

        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("resume_id", data)
        self.assertIn("parsed_skills", data)
        self.assertTrue(len(data["resume_id"]) > 0)
        self.assertIn("Python", data["parsed_skills"])
        self.assertIn("Java", data["parsed_skills"])
        self.assertIn("AWS", data["parsed_skills"])

    def test_05_resume_upload_error_handling(self):
        """Test error handling for non-PDF files and empty uploads"""
        client = TestClient(app)
        
        # Non-PDF upload
        resp_txt = client.post(
            "/api/v1/resume/upload",
            files={"file": ("resume.txt", b"Plain text resume content", "text/plain")}
        )
        self.assertEqual(resp_txt.status_code, 400)
        self.assertIn("Invalid file type", resp_txt.json()["detail"])

        # Empty file
        resp_empty = client.post(
            "/api/v1/resume/upload",
            files={"file": ("empty.pdf", b"", "application/pdf")}
        )
        self.assertEqual(resp_empty.status_code, 400)

    def test_06_scope_boundary_checks(self):
        """Verify Day 4 endpoints (ATS score / Recommendations) are correctly registered"""
        routes = [route.path for route in app.routes]
        self.assertIn("/api/v1/resume/{resume_id}/ats-score", routes)
        self.assertIn("/api/v1/recommendations", routes)

if __name__ == '__main__':
    unittest.main()
