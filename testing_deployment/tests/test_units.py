"""Pure unit tests (no database / services needed):  pytest tests/test_units.py"""
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend_jayashree", "services", "job-service"))

from app import alerts, competition  # noqa: E402
from app.models.alert_preference import AlertPreference  # noqa: E402

P = dict(AlertPreference.DEFAULTS)


def test_level_low_medium_high():
    assert competition.level_for(0, 1) == "Low"
    assert competition.level_for(4, 100) == "Low"
    assert competition.level_for(5, 100) == "Medium"
    assert competition.level_for(15, 500) == "High"
    assert competition.level_for(6, 1) == "High"      # 6 applicants on day one = fast-moving


def test_posted_ago_and_early_window():
    assert "hour" in competition.posted_ago(3) or "h" in competition.posted_ago(3)
    now = datetime(2026, 1, 3, 12, 0)
    young = competition.indicators(datetime(2026, 1, 3, 0, 0), 2, now=now)
    old = competition.indicators(datetime(2025, 12, 25, 0, 0), 2, now=now)
    assert young["early_window_open"] is True and old["early_window_open"] is False


def test_quiet_hours_overnight_and_timezone():
    prefs = dict(P, quiet_start="22:00", quiet_end="07:00", tz_offset_minutes=330)  # IST
    assert alerts.in_quiet_hours(prefs, datetime(2026, 1, 1, 17, 0)) is True    # 22:30 IST
    assert alerts.in_quiet_hours(prefs, datetime(2026, 1, 1, 3, 0)) is False    # 08:30 IST
    assert alerts.in_quiet_hours(dict(P), datetime(2026, 1, 1, 3, 0)) is False  # no window set


def test_choose_alert_priority():
    p = dict(P, high_match=True, startup_hiring=True, low_competition=True, instant_job=True, match_threshold=70)
    assert alerts.choose_alert(p, 90, "Low", True) == "high_match"
    assert alerts.choose_alert(p, 55, "Low", True) == "startup_hiring"
    assert alerts.choose_alert(dict(p, startup_hiring=False), 55, "Low", False) == "low_competition"
    assert alerts.choose_alert(p, 10, "High", False) == "instant_job"
    assert alerts.choose_alert(dict(p, instant_job=False), 10, "High", False) is None
    assert alerts.choose_alert(dict(P), 60, "High", False) is None            # defaults: below threshold, not low comp
