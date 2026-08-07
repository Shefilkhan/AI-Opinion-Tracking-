"""GitHub issues/PR search via REST API."""

from __future__ import annotations

import logging

import requests

from app.core.config import get_settings
from app.services.cache_utils import cached
from app.services.platforms.platform_common import (
    build_result,
    log_platform_error,
    log_platform_success,
)
from app.services.platforms.query_helpers import (
    filter_by_time_range,
    make_search_cache_key,
    sort_results_by_posted_at,
)

logger = logging.getLogger(__name__)
TIMEOUT = 12
GITHUB_API_BASE = "https://api.github.com"


def _headers() -> dict[str, str]:
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "OpinionPulse/1.0",
    }
    token = (get_settings().github_token or "").strip()
    if token:
        headers["Authorization"] = f"Bearer {token}"
    else:
        print("⚠️ GitHub: no token configured, using unauthenticated rate limits (60/hr)")
    return headers


def search_github(query: str, time_range: str = "24h", limit: int = 15) -> list[dict]:
    cache_key = make_search_cache_key("github", query, time_range, str(limit))

    def fetch() -> list[dict]:
        try:
            search_q = query.strip()
            lower_q = search_q.lower()
            if (
                "is:issue" not in lower_q
                and "is:pull-request" not in lower_q
                and "is:pr" not in lower_q
            ):
                search_q = f"{search_q} is:issue"

            resp = requests.get(
                f"{GITHUB_API_BASE}/search/issues",
                params={
                    "q": search_q,
                    "sort": "updated",
                    "order": "desc",
                    "per_page": limit,
                },
                headers=_headers(),
                timeout=TIMEOUT,
            )

            if resp.status_code == 401:
                logger.warning(
                    "GitHub auth failed (401) — GITHUB_TOKEN is invalid or expired; "
                    "update .env.local or remove the token to use unauthenticated limits (60/hr)"
                )
                unauth_headers = {
                    "Accept": "application/vnd.github+json",
                    "User-Agent": "OpinionPulse/1.0",
                }
                resp = requests.get(
                    f"{GITHUB_API_BASE}/search/issues",
                    params={
                        "q": search_q,
                        "sort": "updated",
                        "order": "desc",
                        "per_page": limit,
                    },
                    headers=unauth_headers,
                    timeout=TIMEOUT,
                )

            if resp.status_code == 403:
                print("⚠️ GitHub rate limit exceeded")
                return []
            if resp.status_code != 200:
                print(f"⚠️ GitHub search failed: {resp.status_code} {resp.text}")
                return []

            items = resp.json().get("items") or []
            out: list[dict] = []
            for item in items:
                title = (item.get("title") or "").strip()
                if not title:
                    continue

                body = (item.get("body") or "")[:300]
                combined_text = f"{title}. {body}"
                user = item.get("user") or {}
                author = user.get("login") or "unknown"
                repo_url = item.get("repository_url") or ""
                repo_name = (
                    repo_url.split("/repos/")[-1]
                    if "/repos/" in repo_url
                    else "unknown"
                )
                is_pr = "pull_request" in item
                reactions = item.get("reactions") or {}
                reaction_total = int(reactions.get("total_count") or 0)

                row = build_result(
                    id=f"github_{item.get('id')}",
                    platform="github",
                    author=f"@{author}",
                    title=title[:120],
                    content=body or title,
                    source_url=item.get("html_url") or "",
                    source_label=f"github.com/{repo_name}",
                    query=query,
                    publication="GitHub",
                    posted_at=item.get("created_at"),
                    engagement={
                        "likes": reaction_total,
                        "shares": 0,
                        "comments": int(item.get("comments") or 0),
                        "views": 0,
                    },
                    sentiment_text=combined_text,
                )
                if row:
                    row["metadata"] = {
                        "repo": repo_name,
                        "type": "pull_request" if is_pr else "issue",
                        "state": item.get("state") or "open",
                    }
                    out.append(row)

            out = filter_by_time_range(out, time_range, fallback_to_all=False)
            out = sort_results_by_posted_at(out)
            log_platform_success("GitHub", query, len(out))
            return out
        except Exception as exc:
            log_platform_error("GitHub", query, exc)
            return []

    return cached(cache_key, fetch, ttl_seconds=120)
