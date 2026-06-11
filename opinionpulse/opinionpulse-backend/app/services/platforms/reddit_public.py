"""Reddit public RSS API (no OAuth required for search)."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any
import re
import html
import xml.etree.ElementTree as ET

import requests

from app.core.config import get_settings
from app.services.cache_utils import cached
from app.services.platforms.platform_common import build_result, log_platform_error, log_platform_success

logger = logging.getLogger(__name__)
TIMEOUT = 12


def _clean_html(html_str: str) -> str:
    if not html_str:
        return ""
    md_match = re.search(r'<!-- SC_OFF -->.*?<div class="md">(.*?)</div>.*?<!-- SC_ON -->', html_str, re.DOTALL)
    if md_match:
        html_str = md_match.group(1)
    else:
        return ""
    
    text = re.sub(r'<[^>]+>', ' ', html_str)
    text = html.unescape(text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def _headers() -> dict[str, str]:
    ua = get_settings().reddit_user_agent.strip() or "Mozilla/5.0 OpinionPulse/1.0"
    return {"User-Agent": ua}


def search_reddit(query: str, time_range: str = "24h", limit: int = 20) -> list[dict]:
    time_map = {"24h": "day", "7d": "week", "30d": "month"}
    t = time_map.get(time_range, "day")
    cache_key = f"reddit_{query}_{t}_{limit}"

    def fetch() -> list[dict]:
        try:
            url = (
                "https://www.reddit.com/search.rss"
                f"?q={requests.utils.quote(query)}&sort=new&t={t}&limit={limit}"
            )
            resp = requests.get(url, headers=_headers(), timeout=TIMEOUT)
            resp.raise_for_status()
            
            root = ET.fromstring(resp.content)
            namespaces = {
                'atom': 'http://www.w3.org/2005/Atom'
            }
            entries = root.findall('.//atom:entry', namespaces)
            results = []
            for entry in entries:
                link_elem = entry.find('atom:link', namespaces)
                link = link_elem.attrib.get('href') if link_elem is not None else ""
                
                if "/comments/" not in link:
                    continue
                    
                title_elem = entry.find('atom:title', namespaces)
                title = title_elem.text if title_elem is not None else ""
                
                author_elem = entry.find('atom:author/atom:name', namespaces)
                author_raw = author_elem.text if author_elem is not None else "unknown"
                author = author_raw.replace("/u/", "").replace("u/", "")
                
                updated_elem = entry.find('atom:updated', namespaces)
                posted_at = updated_elem.text if updated_elem is not None else ""
                
                content_elem = entry.find('atom:content', namespaces)
                content_html = content_elem.text if content_elem is not None else ""
                
                selftext = _clean_html(content_html)
                content = selftext if selftext else title
                
                img_match = re.search(r'<img src="([^"]+)"', content_html)
                image_url = html.unescape(img_match.group(1)) if img_match else None
                
                subreddit = "all"
                parts = link.split('/')
                if 'r' in parts:
                    ridx = parts.index('r')
                    if ridx + 1 < len(parts):
                        subreddit = parts[ridx + 1]
                        
                post_id = "unknown"
                if 'comments' in parts:
                    cidx = parts.index('comments')
                    if cidx + 1 < len(parts):
                        post_id = parts[cidx + 1]
                
                results.append(build_result(
                    id=f"reddit_{post_id}",
                    platform="reddit",
                    author=f"u/{author}",
                    title=title,
                    content=content,
                    source_url=link,
                    source_label=f"reddit.com/r/{subreddit}",
                    query=query,
                    publication="Reddit",
                    image_url=image_url,
                    posted_at=posted_at,
                    engagement={
                        "likes": 0,
                        "shares": 0,
                        "comments": 0,
                        "views": 0,
                    },
                    sentiment_text=f"{title} {selftext}",
                ))
            log_platform_success("Reddit", query, len(results))
            return results
        except Exception as exc:
            log_platform_error("Reddit", query, exc)
            return []

    return cached(cache_key, fetch, ttl_seconds=120)


def get_trending_reddit(limit: int = 10) -> list[dict]:
    import random

    subs = ["worldnews", "technology", "politics", "business", "science"]
    sub = random.choice(subs)
    cache_key = f"reddit_trending_{sub}_{limit}"

    def fetch() -> list[dict]:
        try:
            url = f"https://www.reddit.com/r/{sub}.rss?limit={limit}"
            resp = requests.get(url, headers=_headers(), timeout=TIMEOUT)
            resp.raise_for_status()
            
            root = ET.fromstring(resp.content)
            namespaces = {
                'atom': 'http://www.w3.org/2005/Atom'
            }
            entries = root.findall('.//atom:entry', namespaces)
            results = []
            for entry in entries:
                link_elem = entry.find('atom:link', namespaces)
                link = link_elem.attrib.get('href') if link_elem is not None else ""
                
                if "/comments/" not in link:
                    continue
                    
                title_elem = entry.find('atom:title', namespaces)
                title = title_elem.text if title_elem is not None else ""
                
                author_elem = entry.find('atom:author/atom:name', namespaces)
                author_raw = author_elem.text if author_elem is not None else "unknown"
                author = author_raw.replace("/u/", "").replace("u/", "")
                
                updated_elem = entry.find('atom:updated', namespaces)
                posted_at = updated_elem.text if updated_elem is not None else ""
                
                content_elem = entry.find('atom:content', namespaces)
                content_html = content_elem.text if content_elem is not None else ""
                
                selftext = _clean_html(content_html)
                content = selftext if selftext else title
                
                img_match = re.search(r'<img src="([^"]+)"', content_html)
                image_url = html.unescape(img_match.group(1)) if img_match else None
                
                parts = link.split('/')
                post_id = "unknown"
                if 'comments' in parts:
                    cidx = parts.index('comments')
                    if cidx + 1 < len(parts):
                        post_id = parts[cidx + 1]
                
                results.append(build_result(
                    id=f"reddit_{post_id}",
                    platform="reddit",
                    author=f"u/{author}",
                    title=title,
                    content=content,
                    source_url=link,
                    source_label=f"reddit.com/r/{sub}",
                    query=sub,
                    publication="Reddit",
                    image_url=image_url,
                    posted_at=posted_at,
                    engagement={
                        "likes": 0,
                        "shares": 0,
                        "comments": 0,
                        "views": 0,
                    },
                    sentiment_text=f"{title} {selftext}",
                ))
            return results
        except Exception as exc:
            log_platform_error("Reddit", f"trending/{sub}", exc)
            return []

    return cached(cache_key, fetch, ttl_seconds=180)
