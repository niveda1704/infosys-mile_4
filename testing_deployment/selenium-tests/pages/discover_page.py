from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class DiscoverPage:

    RESULTS_COUNT = (By.ID, "job-results-count")
    OPEN_FILTERS_BUTTON = (By.ID, "btn-open-filters")
    REMOTE_FILTER = (By.ID, "filter-work-mode-remote")
    APPLY_FILTERS_BUTTON = (By.ID, "btn-apply-filters")
    RESET_FILTERS_BUTTON = (By.ID, "btn-reset-filters")
    SEARCH_INPUT = (By.ID,"job-search-input")
    JOB_CARDS = (By.CSS_SELECTOR,"[data-testid='job-card']")
    SAVE_BUTTON = (By.ID,"btn-card-save")
    APPLY_BUTTON = (By.ID,"btn-card-apply")
    SKIP_BUTTON = (By.ID,"btn-card-skip")

    # Text shown in the loading state — adjust if your actual copy differs
    LOADING_TEXT = "Loading job opportunities"

    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 15)

    def open(self):
        self.driver.get("http://localhost:3000/discover")
        self.wait.until(EC.presence_of_element_located(self.RESULTS_COUNT))
        self._wait_for_results_loaded()
        return self

    def _wait_for_results_loaded(self):
        """
        Wait until the loading spinner/text is gone, so we know the
        debounced fetch has actually resolved before reading the count.
        """
        try:
            WebDriverWait(self.driver, 15).until_not(
                EC.text_to_be_present_in_element(
                    (By.TAG_NAME, "body"), self.LOADING_TEXT
                )
            )
        except Exception:
            pass  # if it never appeared at all, that's fine too

        # Extra settle time for the debounce (350ms) + result re-render
        WebDriverWait(self.driver, 15).until(
            lambda d: self._extract_count(
                d.find_element(*self.RESULTS_COUNT).text
            ) is not None
        )

    @staticmethod
    def _extract_count(text):
        import re
        match = re.search(r"\d+", text)
        return int(match.group()) if match else None

    def get_role_count_text(self):
        self._wait_for_results_loaded()
        element = self.wait.until(
            EC.visibility_of_element_located(self.RESULTS_COUNT)
        )
        return element.text

    def open_filters(self):
        button = self.wait.until(
            EC.element_to_be_clickable(self.OPEN_FILTERS_BUTTON)
        )
        button.click()

    def select_work_mode(self, mode):
        if mode == "Remote":
            button = self.wait.until(
                EC.element_to_be_clickable(self.REMOTE_FILTER)
            )
            button.click()
        else:
            raise ValueError(f"Unsupported work mode: {mode}")

    def apply_filters(self):
        button = self.wait.until(
            EC.element_to_be_clickable(self.APPLY_FILTERS_BUTTON)
        )
        button.click()

        self.wait.until(
            EC.invisibility_of_element_located(self.APPLY_FILTERS_BUTTON)
        )

        # Give the debounced re-fetch time to complete before reading counts
        self._wait_for_results_loaded()

    def reset_filters(self):
        button = self.wait.until(
            EC.element_to_be_clickable(self.RESET_FILTERS_BUTTON)
        )
        button.click()

        self.wait.until(
            EC.invisibility_of_element_located(self.RESET_FILTERS_BUTTON)
        )

        self._wait_for_results_loaded()
    
    def search(self, text):

        search_input = self.wait.until(
            EC.visibility_of_element_located(
                self.SEARCH_INPUT
            )
        )

        search_input.clear()
        search_input.send_keys(text)

        return self

    def get_search_value(self):

        search_input = self.wait.until(
            EC.visibility_of_element_located(
                self.SEARCH_INPUT
            )
        )

        return search_input.get_attribute("value")
    
    def save_job(self):
        button = self.wait.until(
            EC.element_to_be_clickable(self.SAVE_BUTTON)
        )
        button.click()
        return button

    def apply_job(self):
        button = self.wait.until(
            EC.element_to_be_clickable(self.APPLY_BUTTON)
        )
        button.click()
        return button

    def skip_job(self):
        button = self.wait.until(
            EC.element_to_be_clickable(self.SKIP_BUTTON)
        )
        button.click()

    # --------------------------------------------------------
    # CARD IDENTITY / EMPTY STATE
    # --------------------------------------------------------

    def get_front_card_id(self):
        card = self.wait.until(
            EC.visibility_of_element_located(self.JOB_CARDS)
        )
        return card.get_attribute("id")  # e.g. "job-card-42"

    def get_front_card_title(self):
        card = self.wait.until(
            EC.visibility_of_element_located(self.JOB_CARDS)
        )
        return card.find_element(By.TAG_NAME, "h2").text

    def is_deck_empty(self):
        try:
            WebDriverWait(self.driver, 5).until(
                EC.visibility_of_element_located(
                    (
                        By.XPATH,
                        "//h3[contains(translate(text(), "
                        "'ABCDEFGHIJKLMNOPQRSTUVWXYZ', "
                        "'abcdefghijklmnopqrstuvwxyz'), "
                        "\"you're all caught up\")]",
                    )
                )
            )
            return True
        except Exception:
            return False
    