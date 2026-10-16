from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE_URL = "http://localhost:3000"


class ResumePage:
    """
    NOTE: selectors below are placeholders — update to match your
    actual ResumeATS / resume analysis page.
    """

    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 10)

    def open(self):
        self.driver.get(f"{BASE_URL}/resume-analysis")
        return self

    def upload_resume(self, file_path):
        file_input = self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='file']"))
        )
        file_input.send_keys(file_path)
        return self

    def get_ats_score(self):
        score_el = self.wait.until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, "[data-testid='ats-score']"))
        )
        return score_el.text