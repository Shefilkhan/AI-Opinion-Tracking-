"""GitHub API integration (Free public API for issues/discussions)."""

from __future__ import annotations

import logging
from typing import Any

import requests

from app.core.config import get_settings
from app.services.cache_utils import cached
from app.services.platforms.platform_common import build_result, log_platform_error, log_platform_success

logger = logging.getLogger(__name__)
TIMEOUT = 12


def _headers() -> dict[str, str]:
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "OpinionPulse/1.0"
    }
    # Optional PAT to increase rate limit from 60/hr to 5000/hr
    # token = get_settings().github_api_key
    # if token:
    #     headers["Authorization"] = f"token {token}"
    return headers


def search_github(query: str, time_range: str = "24h", limit: int = 20) -> list[dict]:
    cache_key = f"github_{query}_{time_range}_{limit}"

    def fetch() -> list[dict]:
        try:
            # We search for issues and PRs across GitHub.
            # We sort by created or updated.
            url = f"https://api.github.com/search/issues?q={requests.utils.quote(query)}&sort=created&order=desc&per_page={limit}"
            resp = requests.get(url, headers=_headers(), timeout=TIMEOUT)
            
            if resp.status_code == 403 and "rate limit" in resp.text.lower():
                logger.warning("GitHub API rate limit exceeded")
                return []
                
            resp.raise_for_status()
            data = resp.json()
            items = data.get("items", [])
            
            results = []
            for item in items:
                title = item.get("title", "")
                content = item.get("body", "") or title
                
                user = item.get("user", {})
                author = user.get("login", "unknown")
                
                repo_url = item.get("repository_url", "")
                repo_name = repo_url.split("/")[-1] if repo_url else "unknown"
                
                state = item.get("state", "open")
                is_pr = "pull_request" in item
                item_type = "PR" if is_pr else "Issue"
                
                results.append(build_result(
                    id=f"github_{item.get('id')}",
                    platform="github",
                    author=f"@{author}",
                    title=title,
                    content=content,
                    source_url=item.get("html_url", ""),
                    source_label=f"github.com/{repo_name}",
                    query=query,
                    publication="GitHub",
                    image_url=None,
                    posted_at=item.get("created_at", ""),
                    engagement={
                        "likes": item.get("reactions", {}).get("+1", 0) + item.get("reactions", {}).get("heart", 0),
                        "shares": 0,
                        "comments": item.get("comments", 0),
                        "views": 0,
                    },
                    sentiment_text=f"{title} {content}",
                ))
                
            log_platform_success("GitHub", query, len(results))
            return results
        except Exception as exc:
            log_platform_error("GitHub", query, exc)
            return []

    return cached(cache_key, fetch, ttl_seconds=120)
