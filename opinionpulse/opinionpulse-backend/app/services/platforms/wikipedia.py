"""Wikipedia REST summary API (no key required)."""

from __future__ import annotations

import logging
from urllib.parse import quote

import requests

from app.services.cache_utils import cached

logger = logging.getLogger(__name__)
TIMEOUT = 6

WIKI_HEADERS = {
    "Accept": "application/json",
    "User-Agent": "OpinionPulse/1.0 (https://github.com/opinionpulse; contact@opinionpulse.app)",
}

# Ambiguous short queries → preferred Wikipedia article titles.
_TITLE_OVERRIDES = {
    "react": "React_(software)",
    "angular": "Angular_(web_framework)",
    "vue": "Vue.js",
    "chatgpt": "ChatGPT",
    "claude": "Claude_(language_model)",
    "openai": "OpenAI",
    "anthropic": "Anthropic",
    "python": "Python_(programming_language)",
    "java": "Java_(programming_language)",
    "rust": "Rust_(programming_language)",
    "meta": "Meta_Platforms",
    "apple": "Apple_Inc.",
    "amazon": "Amazon_(company)",
    "bitcoin": "Bitcoin",
    "tesla": "Tesla,_Inc.",
}


def _wiki_title(query: str) -> str:
    return query.strip().replace(" ", "_")


def _preferred_title(query: str) -> str | None:
    return _TITLE_OVERRIDES.get(query.strip().lower())


def _fallback_wiki_link(query: str) -> dict:
    q = query.strip()
    return {
        "title": q,
        "summary": "",
        "url": f"https://en.wikipedia.org/wiki/Special:Search?search={quote(q)}",
        "thumbnail": None,
    }


def _fetch_summary(title: str) -> requests.Response:
    return requests.get(
        f"https://en.wikipedia.org/api/rest_v1/page/summary/{requests.utils.quote(title)}",
        headers=WIKI_HEADERS,
        timeout=TIMEOUT,
    )


def _search_wikipedia_title(query: str) -> str | None:
    try:
        resp = requests.get(
            "https://en.wikipedia.org/w/api.php",
            params={
                "action": "opensearch",
                "search": query.strip(),
                "limit": 3,
                "namespace": 0,
                "format": "json",
            },
            headers=WIKI_HEADERS,
            timeout=TIMEOUT,
        )
        if not resp.ok:
            return None
        titles = resp.json()[1] if len(resp.json()) >= 2 else []
        if not titles:
            return None
        q = query.strip().lower()
        for title in titles:
            lower = str(title).lower()
            if "disambiguation" in lower:
                continue
            if q in lower or any(
                hint in lower
                for hint in ("software", "framework", "company", "model", "language")
            ):
                return str(title).replace(" ", "_")
        return str(titles[0]).replace(" ", "_")
    except Exception as exc:
        logger.debug("Wikipedia opensearch failed for '%s': %s", query, exc)
    return None


def _summary_from_response(data: dict, query: str, title: str) -> dict | None:
    extract = (data.get("extract") or "").strip()
    if not extract:
        return None
    page_url = (
        data.get("content_urls", {})
        .get("desktop", {})
        .get("page")
        or f"https://en.wikipedia.org/wiki/{title}"
    )
    return {
        "title": data.get("title") or query,
        "summary": extract[:400],
        "url": page_url,
        "thumbnail": (data.get("thumbnail") or {}).get("source"),
    }


def get_wikipedia_summary(query: str) -> dict | None:
    cache_key = f"wikipedia_v2_{query.lower()}"

    def fetch() -> dict | None:
        try:
            candidates: list[str] = []
            preferred = _preferred_title(query)
            if preferred:
                candidates.append(preferred)
            candidates.append(_wiki_title(query))

            for title in candidates:
                resp = _fetch_summary(title)
                if not resp.ok:
                    continue
                data = resp.json()
                if data.get("type") == "disambiguation":
                    continue
                summary = _summary_from_response(data, query, title)
                if summary:
                    logger.info("Wikipedia: summary for '%s' via %s", query, title)
                    return summary

            resolved = _search_wikipedia_title(query)
            if resolved and resolved not in candidates:
                resp = _fetch_summary(resolved)
                if resp.ok:
                    data = resp.json()
                    if data.get("type") != "disambiguation":
                        summary = _summary_from_response(data, query, resolved)
                        if summary:
                            return summary

            return _fallback_wiki_link(query)
        except Exception as exc:
            logger.error("Wikipedia summary failed for '%s': %s", query, exc)
            return _fallback_wiki_link(query)

    return cached(cache_key, fetch, ttl_seconds=3600)


def ensure_wikipedia_link(query: str, summary: dict | None) -> dict:
    """Always return a wiki_summary dict with at least a search URL."""
    if summary and summary.get("url"):
        return summary
    return _fallback_wiki_link(query)
