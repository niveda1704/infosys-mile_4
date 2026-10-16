from pages.login_page import LoginPage


def test_login_with_valid_credentials(driver):
    page = LoginPage(driver).open()
    page.login("iampushkar2006@gmail.com", "Hello@123")
    assert page.is_logged_in(), "Expected user to be logged in after valid credentials"


def test_login_with_invalid_credentials_shows_error(driver):
    page = LoginPage(driver).open()
    page.login("wronguser@example.com", "wrongpassword")
    error = page.get_error_message()
    assert error is not None
    assert "invalid" in error.lower() or "incorrect" in error.lower()


def test_login_with_empty_fields_does_not_submit(driver):
    page = LoginPage(driver).open()
    page.login("", "")
    # Should remain on login page since backend requires both fields
    assert "/login" in driver.current_url