"""Pure-logic tests (no DB) covering the fixes to core correctness."""
from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.services.sentiment_analysis import analyze_sentiment
from app.services.pulse_metrics import compute_metrics_from_history
from app.services.crisis_narrative_service import _normalize_severity
from app.services.url_validation import is_live_result
from app.services.user_profile_service import validate_username


@pytest.mark.parametrize(
    "text,expected",
    [
        ("government approved the plan", "positive"),   # was wrongly negated
        ("current crisis deepens", "negative"),          # was wrongly positive
        ("investment boom continues", "positive"),       # was wrongly negated
        ("this is a great product", "positive"),
        ("this is not good at all", "negative"),         # real negation still works
    ],
)
def test_sentiment_negation(text, expected):
    assert analyze_sentiment(text)["sentiment"] == expected


def test_first_scan_is_not_a_false_crisis():
    vol, vel, base, quadrant = compute_metrics_from_history(
        [], current_total=5, current_negative=3
    )
    assert quadrant == "quiet"


def test_real_spike_is_still_crisis():
    hist = [(None, 2, 0), (None, 1, 0), (None, 2, 1)]
    _, _, _, quadrant = compute_metrics_from_history(
        hist, current_total=40, current_negative=20
    )
    assert quadrant == "crisis"


@pytest.mark.parametrize(
    "value,expected",
    [("moderate", "medium"), ("severe", "high"), ("critical", "critical"),
     ("bogus", "medium"), (None, "medium"), ("LOW", "low")],
)
def test_crisis_severity_normalization(value, expected):
    assert _normalize_severity(value) == expected


def test_hackernews_external_url_is_live():
    row = {"platform": "hackernews", "url": "https://techcrunch.com/x", "is_demo": False}
    assert is_live_result(row) is True


@pytest.mark.parametrize("name", ["admin", "Billing", "ab"])
def test_reserved_or_invalid_usernames_rejected(name):
    with pytest.raises(HTTPException):
        validate_username(name)


def test_valid_username_allowed():
    validate_username("cool_user1")  # should not raise
