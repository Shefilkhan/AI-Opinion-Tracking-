"""Tests for Wikipedia summary resolution."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from app.services.platforms.wikipedia import (
    _fallback_wiki_link,
    ensure_wikipedia_link,
    get_wikipedia_summary,
)


def test_fallback_wiki_link():
    link = _fallback_wiki_link("React")
    assert link["url"].startswith("https://en.wikipedia.org/")
    assert "React" in link["url"]


def test_ensure_wikipedia_link_uses_existing():
    existing = {
        "title": "React (JavaScript library)",
        "summary": "React is a JavaScript library.",
        "url": "https://en.wikipedia.org/wiki/React_(JavaScript_library)",
    }
    assert ensure_wikipedia_link("React", existing) is existing


def test_ensure_wikipedia_link_fallback():
    result = ensure_wikipedia_link("Obscure Topic XYZ", None)
    assert result["url"].startswith("https://en.wikipedia.org/wiki/Special:Search")


def test_disambiguation_resolves_via_search():
    disambig = {"type": "disambiguation", "title": "React"}
    resolved = {
        "type": "standard",
        "title": "React (JavaScript library)",
        "extract": "React is a free and open-source front-end JavaScript library.",
        "content_urls": {
            "desktop": {"page": "https://en.wikipedia.org/wiki/React_(JavaScript_library)"}
        },
    }

    with patch("app.services.platforms.wikipedia.cached") as mock_cached:
        mock_cached.side_effect = lambda _key, fn, ttl_seconds=3600: fn()

        with patch("app.services.platforms.wikipedia._fetch_summary") as mock_fetch:
            mock_fetch.side_effect = [
                MagicMock(ok=True, status_code=200, json=lambda: disambig),
                MagicMock(ok=True, status_code=200, json=lambda: resolved),
            ]
            with patch(
                "app.services.platforms.wikipedia._search_wikipedia_title",
                return_value="React_(JavaScript_library)",
            ):
                result = get_wikipedia_summary("React")

    assert result is not None
    assert "JavaScript library" in result["summary"]
    assert result["url"].endswith("React_(JavaScript_library)")
