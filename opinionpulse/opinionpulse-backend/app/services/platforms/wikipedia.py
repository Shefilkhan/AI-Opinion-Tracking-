"""Wikipedia REST summary API (no key required)."""

from __future__ import annotations

import logging

import requests

from app.services.cache_utils import cached

logger = logging.getLogger(__name__)
TIMEOUT = 10

WIKI_HEADERS = {
    "Accept": "application/json",
    "User-Agent": "OpinionPulse/1.0 (https://github.com/opinionpulse; contact@opinionpulse.app)",
}


def _wiki_title(query: str) -> str:
    return query.strip().replace(" ", "_")


def _fetch_summary(title: str) -> requests.Response:
    return requests.get(
        f"https://en.wikipedia.org/api/rest_v1/page/summary/{requests.utils.quote(title)}",
        headers=WIKI_HEADERS,
        timeout=TIMEOUT,
    )


def _search_wikipedia_title(query: str) -> str | None:
    """Resolve query to a Wikipedia page title when direct lookup 404s."""
    try:
        resp = requests.get(
            "https://en.wikipedia.org/w/api.php",
            params={
                "action": "opensearch",
                "search": query.strip(),
                "limit": 1,
                "namespace": 0,
                "format": "json",
            },
            headers=WIKI_HEADERS,
            timeout=TIMEOUT,
        )
        if not resp.ok:
            return None
        data = resp.json()
        if len(data) >= 2 and data[1]:
            return str(data[1][0]).replace(" ", "_")
    except Exception as exc:
        logger.debug("Wikipedia opensearch failed for '%s': %s", query, exc)
    return None


def get_wikipedia_summary(query: str) -> dict | None:
    cache_key = f"wikipedia_{query.lower()}"

    def fetch() -> dict | None:
        try:
            title = _wiki_title(query)
            resp = _fetch_summary(title)
            if resp.status_code == 404:
                resolved = _search_wikipedia_title(query)
                if resolved and resolved.lower() != title.lower():
                    title = resolved
                    resp = _fetch_summary(title)
            if not resp.ok:
                logger.warning(
                    "Wikipedia: no summary for '%s' (%s)",
                    query,
                    resp.status_code,
                )
                return None
            data = resp.json()
            if data.get("type") == "disambiguation":
                return None
            extract = (data.get("extract") or "").strip()
            if not extract:
                return None
            page_url = (
                data.get("content_urls", {})
                .get("desktop", {})
                .get("page")
                or f"https://en.wikipedia.org/wiki/{title}"
            )
            summary = {
                "title": data.get("title") or query,
                "summary": extract[:400],
                "url": page_url,
                "thumbnail": (data.get("thumbnail") or {}).get("source"),
            }
            logger.info("Wikipedia: summary found for '%s'", query)
            return summary
        except Exception as exc:
            logger.error("Wikipedia summary failed for '%s': %s", query, exc)
            return None

    return cached(cache_key, fetch, ttl_seconds=3600)
