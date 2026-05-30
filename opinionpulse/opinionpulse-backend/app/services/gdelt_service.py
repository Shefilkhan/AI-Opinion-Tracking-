import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import requests

logger = logging.getLogger(__name__)

GDELT_DOC_URL = "https://api.gdeltproject.org/api/v2/doc/doc"
REQUEST_TIMEOUT = 10


def _parse_seendate(value: Optional[str]) -> Optional[datetime]:
    """Parse GDELT seendate format YYYYMMDDHHMMSS to UTC datetime."""
    if not value or not isinstance(value, str):
        return None
    cleaned = value.strip()
    if len(cleaned) < 8:
        return None
    try:
        if len(cleaned) >= 14:
            dt = datetime.strptime(cleaned[:14], "%Y%m%d%H%M%S")
        else:
            dt = datetime.strptime(cleaned[:8], "%Y%m%d")
        return dt.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def _stable_id_from_title_date(title: str, seendate: Optional[str]) -> str:
    raw = f"{title}|{seendate or ''}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:64]


def _normalize_article(article: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    title = (article.get("title") or "").strip()
    if not title:
        return None

    url = (article.get("url") or "").strip() or None
    seendate = article.get("seendate")
    domain = (article.get("domain") or "").strip()
    source_country = (article.get("sourcecountry") or "").strip()

    source_item_id = url if url else _stable_id_from_title_date(title, str(seendate) if seendate else None)

    snippet_parts = [title]
    if domain:
        snippet_parts.append(f"({domain})")
    if source_country:
        snippet_parts.append(f"[{source_country}]")
    text = " — ".join(snippet_parts)

    author = "GDELT"
    if domain:
        author = f"GDELT · {domain}"

    return {
        "source_item_id": source_item_id[:255],
        "author": author[:255],
        "text": text,
        "url": url[:512] if url else None,
        "published_at": _parse_seendate(str(seendate) if seendate else None),
        "engagement_score": 0,
        "raw_json": article,
    }


def search_gdelt_articles(query: str, max_records: int = 10) -> List[Dict[str, Any]]:
    """
    Search GDELT DOC 2.0 API (ArtList mode) and return normalized mention dicts.
    Returns empty list on failure.
    """
    query = query.strip()
    if not query:
        return []

    # Phrase-style query improves match quality for multi-word keywords
    gdelt_query = f'"{query}"' if " " in query else query

    params = {
        "query": gdelt_query,
        "mode": "ArtList",
        "maxrecords": max(1, min(max_records, 250)),
        "format": "json",
        "sort": "DateDesc",
    }

    try:
        response = requests.get(
            GDELT_DOC_URL,
            params=params,
            timeout=REQUEST_TIMEOUT,
            headers={"User-Agent": "OpinionPulse/1.0 (academic project)"},
        )
        response.raise_for_status()
        payload = response.json()
    except requests.RequestException as exc:
        logger.warning("GDELT request failed for query=%s: %s", query, exc)
        return []
    except (ValueError, json.JSONDecodeError) as exc:
        logger.warning("GDELT invalid JSON for query=%s: %s", query, exc)
        return []

    articles = payload.get("articles") if isinstance(payload, dict) else None
    if not articles or not isinstance(articles, list):
        return []

    normalized: List[Dict[str, Any]] = []
    seen_ids: set[str] = set()
    for article in articles:
        if not isinstance(article, dict):
            continue
        item = _normalize_article(article)
        if item is None:
            continue
        sid = item["source_item_id"]
        if sid in seen_ids:
            continue
        seen_ids.add(sid)
        normalized.append(item)

    return normalized
