"""YouTube-specific analytics: creator vs audience sentiment, themes, engagement weighting."""

from __future__ import annotations

import math
from collections import Counter
from typing import Any

from app.services.keywords_utils import extract_keywords_from_results
from app.services.sentiment_analysis import analyze_sentiment, calculate_sentiment_summary


def _engagement_weight(likes: int) -> float:
    """
    Bounded engagement weight for audience sentiment.
    Formula: weight = 1 + log1p(like_count)
    Prevents viral comments from dominating unboundedly.
    """
    return 1.0 + math.log1p(max(0, likes))


def _pct_summary(rows: list[dict[str, Any]]) -> dict[str, float]:
    if not rows:
        return {"positive": 0.0, "negative": 0.0, "neutral": 0.0}
    return calculate_sentiment_summary(rows)


def _weighted_sentiment(rows: list[dict[str, Any]]) -> dict[str, float]:
    """Engagement-weighted sentiment percentages for audience comments/replies."""
    if not rows:
        return {"positive": 0.0, "negative": 0.0, "neutral": 0.0}

    weights = {"positive": 0.0, "negative": 0.0, "neutral": 0.0}
    for row in rows:
        label = row.get("sentiment") or "neutral"
        if label not in weights:
            label = "neutral"
        likes = int((row.get("engagement") or {}).get("likes") or 0)
        weights[label] += _engagement_weight(likes)

    total = sum(weights.values()) or 1.0
    return {k: round(v / total * 100, 1) for k, v in weights.items()}


def _theme_sentiment(
    audience_rows: list[dict[str, Any]],
    themes: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Attach sentiment breakdown per theme keyword."""
    out: list[dict[str, Any]] = []
    for theme in themes[:10]:
        word = (theme.get("label") or theme.get("word") or "").lower()
        if not word or len(word) < 3:
            continue
        matched = [
            r
            for r in audience_rows
            if word in f"{r.get('title') or ''} {r.get('content') or ''}".lower()
        ]
        if not matched:
            continue
        summary = _pct_summary(matched)
        out.append(
            {
                "label": theme.get("label") or theme.get("word"),
                "mentions": len(matched),
                "positive": summary["positive"],
                "neutral": summary["neutral"],
                "negative": summary["negative"],
            }
        )
    out.sort(key=lambda t: t["mentions"], reverse=True)
    return out


def build_youtube_summary(all_youtube_rows: list[dict[str, Any]]) -> dict[str, Any] | None:
    """
    Build platform-level YouTube analytics from normalized search results.
    Separates creator (video) sentiment from audience (comment/reply) sentiment.
    """
    if not all_youtube_rows:
        return None

    videos = [
        r for r in all_youtube_rows
        if (r.get("content_type") or "") == "video"
    ]
    audience = [
        r for r in all_youtube_rows
        if (r.get("content_type") or "") in ("comment", "reply")
    ]

    total_views = sum(int((v.get("engagement") or {}).get("views") or 0) for v in videos)
    total_likes = sum(int((v.get("engagement") or {}).get("likes") or 0) for v in videos)
    total_video_comments = sum(int((v.get("engagement") or {}).get("comments") or 0) for v in videos)

    replies = [r for r in audience if r.get("content_type") == "reply"]
    comments = [r for r in audience if r.get("content_type") != "reply"]

    themes_raw = extract_keywords_from_results(audience[:200] if audience else all_youtube_rows)
    themes = [
        {"label": k["word"], "count": k["count"]}
        for k in themes_raw[:12]
        if len(k.get("word", "")) >= 3
    ]

    creator_sentiment = _pct_summary(videos)
    audience_sentiment = _pct_summary(audience)
    weighted_audience = _weighted_sentiment(audience)

    return {
        "platform": "youtube",
        "videos_analyzed": len(videos),
        "comments_analyzed": len(comments),
        "replies_analyzed": len(replies),
        "total_views": total_views,
        "total_likes": total_likes,
        "total_comments": total_video_comments,
        "creator_sentiment": creator_sentiment,
        "audience_sentiment": audience_sentiment,
        "engagement_weighted_audience_sentiment": weighted_audience,
        "top_themes": themes,
        "theme_sentiment": _theme_sentiment(audience, themes),
        "engagement_weight_formula": "1 + log1p(like_count)",
    }
