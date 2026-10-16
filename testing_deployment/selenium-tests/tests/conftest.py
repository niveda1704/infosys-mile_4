import pytest

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait


@pytest.fixture
def driver():

    options = Options()
    options.add_argument("--start-maximized")

    driver = webdriver.Chrome(options=options)

    driver.implicitly_wait(5)

    yield driver

    driver.quit()


@pytest.fixture
def logged_in_driver(driver):

    from pages.login_page import LoginPage

    login_page = LoginPage(driver)

    login_page.open()

    login_page.login(
        "iampushkar2006@gmail.com",
        "Hello@123"
    )

    # Wait until JWT access token exists
    WebDriverWait(driver, 15).until(
        lambda d: d.execute_script(
            "return localStorage.getItem('swipex_access_token');"
        ) is not None
    )

    # Wait until React redirects away from login
    WebDriverWait(driver, 15).until(
        lambda d: "/login" not in d.current_url
    )

    yield driver

# import pytest
# from selenium import webdriver
# from selenium.webdriver.chrome.options import Options


# @pytest.fixture
# def driver():
#     options = Options()
#     # options.add_argument("--headless=new")  # uncomment for CI
#     options.add_argument("--start-maximized")
#     driver = webdriver.Chrome(options=options)
#     driver.implicitly_wait(2)
#     yield driver
#     driver.quit()


# @pytest.fixture
# def logged_in_driver(driver):
#     """
#     Logs in with a test account before yielding the driver.
#     Update credentials to a real seeded test user in your DB.
#     """
#     from pages.login_page import LoginPage

#     page = LoginPage(driver)
#     page.open()
#     page.login("iampushkar2006@gmail.com", "Hello@123")
#     return driver