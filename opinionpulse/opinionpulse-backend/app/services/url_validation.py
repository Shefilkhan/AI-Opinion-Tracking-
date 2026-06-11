"""Validate and fix source URLs on search results."""

from __future__ import annotations

from urllib.parse import quote, urlparse
from typing import Any

NEWS_DEMO_URLS: list[tuple[str, str]] = [
    ("https://www.bloomberg.com/crypto", "bloomberg.com/crypto"),
    ("https://www.reuters.com/technology/", "reuters.com/technology"),
    ("https://www.bbc.com/news/technology", "bbc.com/news/technology"),
    ("https://edition.cnn.com/business/tech", "cnn.com/business/tech"),
]


def is_valid_url(url: str) -> bool:
    if not url or not isinstance(url, str):
        return False
    try:
        parsed = urlparse(url)
        if not parsed.scheme.startswith("http"):
            return False
        path = (parsed.path or "").lower()
        if "/example/" in path:
            return False
        if "/placeholder/" in path:
            return False
        if "/fake/" in path:
            return False
        if parsed.hostname in ("example.com", "news.com"):
            return False
        return True
    except Exception:
        return False


def is_live_result(result: dict[str, Any]) -> bool:
    """True when URL looks like a real post/article, not demo search page."""
    if result.get("is_demo"):
        return False
    url = (result.get("url") or "").lower()
    platform = result.get("platform", "")
    if not is_valid_url(result.get("url", "")):
        return False
    if platform == "reddit":
        return "reddit.com/r/" in url and "/comments/" in url
    if platform == "youtube":
        return "watch?v=" in url
    if platform == "news":
        for demo_url, _ in NEWS_DEMO_URLS:
            if demo_url.lower() in url or url.rstrip("/") == demo_url.lower().rstrip("/"):
                return False
        return True
    if platform == "devto":
        return "dev.to/" in url and "/search" not in url
    if platform == "hackernews":
        return "ycombinator.com" in url
    return False


def get_fallback_url(platform: str, query: str) -> str:
    encoded = quote(query)
    fallbacks = {
        "reddit": f"https://www.reddit.com/search/?q={encoded}",
        "news": f"https://news.google.com/search?q={encoded}",
        "youtube": f"https://www.youtube.com/results?search_query={encoded}",
        "devto": f"https://dev.to/search?q={encoded}",
        "hackernews": f"https://hn.algolia.com/?q={encoded}",
    }
    return fallbacks.get(platform, f"https://www.google.com/search?q={encoded}")


def get_fallback_label(platform: str, query: str) -> str:
    encoded = quote(query)
    labels = {
        "reddit": "reddit.com/search",
        "news": "news.google.com/search",
        "youtube": "youtube.com/search",
        "devto": "dev.to",
        "hackernews": "news.ycombinator.com",
    }
    return labels.get(platform, f'Search for "{query}"')


def assign_demo_urls(results: list[dict[str, Any]], query: str) -> list[dict[str, Any]]:
    """Replace invalid mock URLs with real platform home/search pages."""
    encoded = quote(query)
    q_lower = query.lower()
    news_idx = 0

    reddit_default = (
        "https://www.reddit.com/r/Bitcoin/hot/"
        if "bitcoin" in q_lower or "crypto" in q_lower
        else f"https://www.reddit.com/search/?q={encoded}"
    )
    reddit_label = (
        "reddit.com/r/Bitcoin"
        if "bitcoin" in q_lower or "crypto" in q_lower
        else "reddit.com/search"
    )

    for row in results:
        plat = row.get("platform", "")
        out = dict(row)
        out["is_demo"] = True

        if plat == "reddit":
            out["url"] = reddit_default
            out["source_label"] = reddit_label
        elif plat in ("twitter", "devto"):
            out["url"] = f"https://dev.to/search?q={encoded}"
            out["source_label"] = "dev.to/search"
        elif plat == "hackernews":
            out["url"] = f"https://news.ycombinator.com/"
            out["source_label"] = "news.ycombinator.com"
        elif plat == "youtube":
            out["url"] = f"https://www.youtube.com/results?search_query={encoded}"
            out["source_label"] = "youtube.com/search"
        elif plat == "news":
            url, label = NEWS_DEMO_URLS[news_idx % len(NEWS_DEMO_URLS)]
            news_idx += 1
            out["url"] = url
            out["source_label"] = label
        else:
            if not is_valid_url(out.get("url", "")):
                out["url"] = get_fallback_url(plat, query)
                out["source_label"] = get_fallback_label(plat, query)

        row.update(out)

    return results


def validate_search_results(
    results: list[dict[str, Any]], query: str, *, mark_demo: bool = False
) -> list[dict[str, Any]]:
    validated = []
    for row in results:
        item = dict(row)
        url = item.get("url") or ""
        if not is_valid_url(url):
            reason = "invalid or fake URL"
            plat = item.get("platform", "unknown")
            item["url"] = get_fallback_url(plat, query)
            item["source_label"] = get_fallback_label(plat, query)
            if mark_demo:
                item["is_demo"] = True
        elif mark_demo:
            item["is_demo"] = True
        else:
            item.setdefault("is_demo", not is_live_result(item))
        validated.append(item)
    return validated
