from pages.discover_page import DiscoverPage


def test_search_jobs(logged_in_driver):

    page = DiscoverPage(logged_in_driver).open()

    page.search("cloud")

    assert page.get_search_value() == "cloud"

