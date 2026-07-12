"""Build a chronological spread timeline from mention results."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from dateutil.parser import parse


def _parse_posted(raw: Any) -> datetime | None:
    if not raw:
        return None
    try:
        if isinstance(raw, datetime):
            dt = raw
        else:
            dt = parse(str(raw))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return None


def build_spread_timeline(results: list[dict], *, limit: int = 8) -> list[dict]:
    """
    Create timeline nodes showing where conversation started and how it spread.
    Rule-based v1: earliest mention = origin, then first hit per new platform.
    """
    dated: list[tuple[datetime, dict]] = []
    for row in results:
        posted = _parse_posted(row.get("posted_at"))
        if posted:
            dated.append((posted, row))

    if not dated:
        return []

    dated.sort(key=lambda item: item[0])
    origin_time, origin_row = dated[0]
    nodes: list[dict] = []
    seen_platforms: set[str] = set()

    def _node(row: dict, posted: datetime, role: str) -> dict:
        platform = (row.get("platform") or "unknown").lower()
        title = (row.get("title") or row.get("content") or "Mention")[:120]
        snippet = (row.get("content") or title)[:200]
        minutes = int((posted - origin_time).total_seconds() // 60)
        return {
            "id": str(uuid4()),
            "platform": platform,
            "title": title,
            "snippet": snippet,
            "source_url": row.get("source_url"),
            "posted_at": posted.isoformat(),
            "minutes_after_origin": max(0, minutes),
            "role": role,
        }

    nodes.append(_node(origin_row, origin_time, "origin"))
    seen_platforms.add((origin_row.get("platform") or "").lower())

    for posted, row in dated[1:]:
        platform = (row.get("platform") or "unknown").lower()
        if platform in seen_platforms:
            continue
        seen_platforms.add(platform)
        role = "amplification" if len(seen_platforms) > 4 else "spread"
        nodes.append(_node(row, posted, role))
        if len(nodes) >= limit:
            break

    return nodes
