import os
import re

from pages.login_page import LoginPage
from pages.resume_analysis_page import ResumeAnalysisPage


TEST_EMAIL = "iampushkar2006@gmail.com"
TEST_PASSWORD = "Hello@123"

RESUME_PATH = os.path.abspath(
    "test-resources/test-resume.pdf"
)


def test_ats_score_generation_after_login(driver):

    # ==================================================
    # STEP 1: LOGIN
    # ==================================================

    login_page = LoginPage(driver).open()

    login_page.login(
        TEST_EMAIL,
        TEST_PASSWORD
    )

    assert login_page.is_logged_in(), \
        "Expected user to be logged in before ATS test"

    print("\n✓ Login successful")


    # ==================================================
    # STEP 2: OPEN RESUME ANALYSIS PAGE
    # ==================================================

    page = ResumeAnalysisPage(driver).open()

    assert "/resume-analysis" in driver.current_url, \
        "Expected Resume Analysis page to be opened"

    print("✓ Resume Analysis page opened")


    # ==================================================
    # STEP 3: VERIFY TEST RESUME
    # ==================================================

    assert os.path.exists(RESUME_PATH), \
        f"Test resume not found: {RESUME_PATH}"

    print(f"✓ Test resume found: {RESUME_PATH}")


    # ==================================================
    # STEP 4: UPLOAD RESUME
    # ==================================================

    page.upload_resume(
        RESUME_PATH
    )

    print("✓ Resume uploaded")


    # ==================================================
    # STEP 5: CLICK RUN ATS SCAN
    # ==================================================

    page.click_analyze()

    print("✓ ATS analysis started")


    # ==================================================
    # STEP 6: WAIT FOR ANALYSIS
    # ==================================================

    page.wait_for_analysis()

    print("✓ ATS analysis completed")


    # ==================================================
    # STEP 7: CHECK FOR FRONTEND/BACKEND ERROR
    # ==================================================

    error_message = page.get_error_message()

    assert error_message is None, \
        f"Resume analysis failed: {error_message}"


    # ==================================================
    # STEP 8: WAIT FOR ATS SCORE
    # ==================================================

    score_text = page.get_ats_score()

    print(f"✓ ATS Score displayed: {score_text}")


    # ==================================================
    # STEP 9: EXTRACT NUMERIC SCORE
    # ==================================================

    match = re.search(
        r"(\d+(?:\.\d+)?)\s*%",
        score_text
    )

    assert match is not None, \
        f"Unable to extract ATS score from: {score_text}"

    score = float(match.group(1))


    # ==================================================
    # STEP 10: VALIDATE SCORE
    # ==================================================

    assert 0 <= score <= 100, \
        f"Invalid ATS score: {score}"

    print(f"✓ ATS Score: {score}/100")


    # ==================================================
    # TEST PASSED
    # ==================================================

    print("\n================================")
    print("       ATS TEST PASSED")
    print("================================")