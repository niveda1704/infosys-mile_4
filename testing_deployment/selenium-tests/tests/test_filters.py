import re
from pages.discover_page import DiscoverPage


def test_remote_filter_narrows_results(logged_in_driver):
    page = DiscoverPage(logged_in_driver).open()
    baseline_text = page.get_role_count_text()
    baseline_count = int(re.search(r"\d+", baseline_text).group())

    page.open_filters()
    page.select_work_mode("Remote")
    page.apply_filters()

    filtered_text = page.get_role_count_text()
    filtered_count = int(re.search(r"\d+", filtered_text).group())

    assert filtered_count < baseline_count, (
        f"Expected Remote filter to reduce results below baseline {baseline_count}, got {filtered_count}"
    )


def test_reset_filters_restores_full_list(logged_in_driver):
    page = DiscoverPage(logged_in_driver).open()
    baseline_text = page.get_role_count_text()
    baseline_count = int(re.search(r"\d+", baseline_text).group())

    page.open_filters()
    page.select_work_mode("Remote")
    page.apply_filters()

    page.open_filters()
    page.reset_filters()

    reset_text = page.get_role_count_text()
    reset_count = int(re.search(r"\d+", reset_text).group())

    assert reset_count == baseline_count


def test_work_mode_badge_shown_on_filtered_card(logged_in_driver):
    page = DiscoverPage(logged_in_driver).open()
    page.open_filters()
    page.select_work_mode("Remote")
    page.apply_filters()

    assert "Remote" in logged_in_driver.page_source