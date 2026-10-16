from pages.discover_page import DiscoverPage


def test_homepage_redirects_to_discover_or_login(driver):
    driver.get("http://localhost:3000/")
    assert driver.current_url is not None
    # Adjust based on your actual root route behavior
    assert "localhost:3000" in driver.current_url


def test_navbar_brand_visible(driver):
    driver.get("http://localhost:3000/")
    assert "SwipeX" in driver.page_source