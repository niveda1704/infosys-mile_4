import os
from pages.resume_page import ResumePage


def test_resume_upload_returns_score(logged_in_driver):
    page = ResumePage(logged_in_driver).open()

    sample_resume_path = os.path.join(os.path.dirname(__file__), "fixtures", "sample_resume.pdf")
    page.upload_resume(sample_resume_path)

    import time
    time.sleep(3)  # allow analysis to complete

    score = page.get_ats_score()
    assert score is not None