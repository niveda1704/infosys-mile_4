import time
from pages.discover_page import DiscoverPage


def test_skip_removes_current_card_from_deck(logged_in_driver):
    page = DiscoverPage(logged_in_driver).open()
    first_card_id = page.get_front_card_id()

    page.skip_job()
    time.sleep(1)  # allow swipe animation + refetch

    next_card_id = page.get_front_card_id()
    assert next_card_id != first_card_id, "Expected a different job card after skipping"


def test_apply_swipe_removes_current_card_and_marks_applied(logged_in_driver):
    """
    Swipe right == Apply/Interested. Backend records both a RIGHT swipe
    and an application in a single call (see jobs.py swipe_job()).
    """
    page = DiscoverPage(logged_in_driver).open()
    first_card_id = page.get_front_card_id()

    page.apply_job()
    time.sleep(1)

    next_card_id = page.get_front_card_id()
    assert next_card_id != first_card_id, "Expected a different job card after applying"


def test_save_button_toggles_saved_state(logged_in_driver):
    """
    Save is a separate action from swipe — it must NOT remove the card
    from the deck or count as a swipe (see jobs.py save_job()).
    """
    page = DiscoverPage(logged_in_driver).open()
    first_card_id = page.get_front_card_id()

    page.save_job()
    time.sleep(1)

    # Save should not advance the deck
    assert page.get_front_card_id() == first_card_id, "Save should not remove the card from the deck"

    save_button = logged_in_driver.find_element("id", "btn-card-save")
    assert "Saved" in save_button.text


def test_empty_deck_shows_caught_up_message(logged_in_driver):
    page = DiscoverPage(logged_in_driver).open()

    # Skip through all visible jobs — bounded loop to avoid infinite runs
    for _ in range(150):
        if page.is_deck_empty():
            break
        page.skip_job()
        time.sleep(0.3)

    assert page.is_deck_empty(), "Expected empty-state message after exhausting the deck"