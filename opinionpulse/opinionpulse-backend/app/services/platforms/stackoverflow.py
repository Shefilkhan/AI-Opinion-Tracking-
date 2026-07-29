"""StackOverflow API integration (Free public API)."""

from __future__ import annotations

import html
import logging
import re

import requests

from app.services.cache_utils import cached
from app.services.platforms.platform_common import (
    build_result,
    log_platform_error,
    log_platform_success,
)
from app.services.platforms.query_helpers import (
    filter_by_time_range,
    filter_relevant_results,
    make_search_cache_key,
    sort_results_by_posted_at,
)

logger = logging.getLogger(__name__)
TIMEOUT = 12


def _clean_html(html_str: str) -> str:
    if not html_str:
        return ""
    text = re.sub(r"<[^>]+>", " ", html_str)
    text = html.unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _stackoverflow_query(query: str) -> str:
    q = query.strip()
    if not q:
        return q
    lower = q.lower()
    if "title:" in lower or "tag:" in lower or "is:" in lower:
        return q
    return f"title:{q}"


def search_stackoverflow(query: str, time_range: str = "24h", limit: int = 20) -> list[dict]:
    cache_key = make_search_cache_key("stackoverflow", query, time_range, str(limit))
    so_query = _stackoverflow_query(query)

    def fetch() -> list[dict]:
        try:
            url = (
                f"https://api.stackexchange.com/2.3/search/advanced"
                f"?order=desc&sort=creation&q={requests.utils.quote(so_query)}"
                f"&site=stackoverflow&filter=withbody&pagesize={limit}"
            )
            resp = requests.get(url, timeout=TIMEOUT)

            if resp.status_code == 400 and "throttle" in resp.text.lower():
                logger.warning("StackOverflow API rate limit exceeded")
                return []

            resp.raise_for_status()
            data = resp.json()
            items = data.get("items", [])

            results = []
            for item in items:
                title = html.unescape(item.get("title", ""))
                content_html = item.get("body", "")
                content = _clean_html(content_html)

                owner = item.get("owner", {})
                author = html.unescape(owner.get("display_name", "unknown"))

                tags = item.get("tags", [])
                tag_str = ", ".join(tags)

                results.append(
                    build_result(
                        id=f"so_{item.get('question_id')}",
                        platform="stackoverflow",
                        author=author,
                        title=title,
                        content=content,
                        source_url=item.get("link", ""),
                        source_label="stackoverflow.com",
                        query=query,
                        publication="StackOverflow",
                        image_url=None,
                        posted_at=item.get("creation_date", 0),
                        engagement={
                            "likes": item.get("score", 0),
                            "shares": 0,
                            "comments": item.get("answer_count", 0),
                            "views": item.get("view_count", 0),
                        },
                        sentiment_text=f"{title} {content} {tag_str}",
                    )
                )

            results = [r for r in results if r]
            results = filter_relevant_results(results, query, fallback_to_all=True)
            results = filter_by_time_range(results, time_range, fallback_to_all=True)
            results = sort_results_by_posted_at(results)
            log_platform_success("StackOverflow", query, len(results))
            return results
        except Exception as exc:
            log_platform_error("StackOverflow", query, exc)
            return []

    return cached(cache_key, fetch, ttl_seconds=120)
