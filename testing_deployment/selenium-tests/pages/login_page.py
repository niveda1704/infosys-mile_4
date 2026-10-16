from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE_URL = "http://localhost:3000"


class LoginPage:
    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 10)

    def open(self):
        self.driver.get(f"{BASE_URL}/login")
        return self

    def login(self, email, password):
        email_input = self.wait.until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
        )
        email_input.clear()
        email_input.send_keys(email)

        password_input = self.driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        password_input.clear()
        password_input.send_keys(password)

        submit_btn = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        submit_btn.click()
        return self

    def get_error_message(self):
        try:
            el = WebDriverWait(self.driver, 5).until(
                EC.visibility_of_element_located((By.CSS_SELECTOR, "[role='alert'], .text-rose-600, .text-red-600"))
            )
            return el.text
        except Exception:
            return None

    def is_logged_in(self):
        # Navbar profile button only renders when isAuthenticated is true
        try:
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "header"))
            )
            return "Log In" not in self.driver.page_source
        except Exception:
            return False