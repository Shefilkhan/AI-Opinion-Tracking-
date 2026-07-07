"""Age group distribution and social media usage context for search results."""

from __future__ import annotations

from typing import Any

PLATFORM_AGE_DEMOGRAPHICS: dict[str, dict[str, int]] = {
    "youtube": {"kids": 15, "teens": 35, "adults": 40, "elderly": 10},
    "reddit": {"kids": 2, "teens": 25, "adults": 65, "elderly": 8},
    "bluesky": {"kids": 1, "teens": 18, "adults": 72, "elderly": 9},
    "mastodon": {"kids": 1, "teens": 12, "adults": 78, "elderly": 9},
    "github": {"kids": 1, "teens": 15, "adults": 78, "elderly": 6},
    "hackernews": {"kids": 0, "teens": 8, "adults": 82, "elderly": 10},
    "devto": {"kids": 0, "teens": 20, "adults": 75, "elderly": 5},
    "newsapi": {"kids": 2, "teens": 15, "adults": 55, "elderly": 28},
    "news": {"kids": 2, "teens": 15, "adults": 55, "elderly": 28},
    "guardian": {"kids": 1, "teens": 10, "adults": 52, "elderly": 37},
    "gnews": {"kids": 2, "teens": 14, "adults": 56, "elderly": 28},
    "currents": {"kids": 2, "teens": 14, "adults": 57, "elderly": 27},
    "mediastack": {"kids": 2, "teens": 14, "adults": 57, "elderly": 27},
    "wikipedia": {"kids": 10, "teens": 25, "adults": 55, "elderly": 10},
}

KIDS_LANGUAGE = ["omg", "lol", "bruh", "lowkey", "slay", "no cap", "cringe", "sus"]
TEEN_LANGUAGE = ["literally", "honestly", "vibe", "aesthetic", "fire", "goat", "ngl"]
ELDERLY_LANGUAGE = ["grandchildren", "retirement", "pension", "classic", "back in my day"]

DAILY_SOCIAL_MEDIA_HOURS: dict[str, dict[str, Any]] = {
    "kids": {"avg": 2.5, "range": "1-4 hrs/day", "risk": "medium"},
    "teens": {"avg": 4.8, "range": "3-7 hrs/day", "risk": "high"},
    "adults": {"avg": 2.3, "range": "1-4 hrs/day", "risk": "low"},
    "elderly": {"avg": 1.1, "range": "0.5-2 hrs/day", "risk": "low"},
}

_DEFAULT_DEMO = {"kids": 5, "teens": 20, "adults": 65, "elderly": 10}


def classify_age_groups(results: list[dict[str, Any]]) -> dict[str, Any]:
    """Return estimated age group distribution across all results."""
    totals = {"kids": 0, "teens": 0, "adults": 0, "elderly": 0}

    for result in results:
        platform = result.get("platform", "newsapi")
        demographics = PLATFORM_AGE_DEMOGRAPHICS.get(platform, _DEFAULT_DEMO)

        for age_group, weight in demographics.items():
            totals[age_group] += weight

        text = (result.get("title", "") + " " + result.get("content", "")).lower()
        if any(w in text for w in KIDS_LANGUAGE):
            totals["kids"] += 10
        if any(w in text for w in TEEN_LANGUAGE):
            totals["teens"] += 8
        if any(w in text for w in ELDERLY_LANGUAGE):
            totals["elderly"] += 10

    total = sum(totals.values()) or 1
    percentages = {k: round((v / total) * 100) for k, v in totals.items()}
    dominant = max(percentages, key=percentages.get)

    return {
        "distribution": percentages,
        "dominant_group": dominant,
        "label": f"Mainly {dominant.title()}s",
    }


def get_usage_context(age_group: str) -> dict[str, Any]:
    data = DAILY_SOCIAL_MEDIA_HOURS.get(age_group, DAILY_SOCIAL_MEDIA_HOURS["adults"])
    return {
        "age_group": age_group,
        "avg_daily_hours": data["avg"],
        "typical_range": data["range"],
        "usage_risk": data["risk"],
    }


def get_all_usage_context() -> list[dict[str, Any]]:
    return [get_usage_context(group) for group in ("kids", "teens", "adults", "elderly")]
