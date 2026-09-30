"""Search intelligence analytics: counts, themes, insights, comparisons."""

from __future__ import annotations

import math
from collections import Counter, defaultdict
from datetime import datetime, timezone
from typing import Any

from dateutil.parser import parse

from app.services.sentiment_analysis import calculate_sentiment_summary
from app.services.theme_service import THEME_MIN_SAMPLE, extract_themes

PRIMARY_TYPES = frozenset({"video", "article", "post", "discussion", "story", "reel"})
AUDIENCE_TYPES = frozenset({"comment", "reply"})

PLATFORM_ENGAGEMENT_CAP = {
    "youtube": 1_000_000,
    "reddit": 10_000,
    "hackernews": 500,
    "github": 500,
    "stackoverflow": 500,
    "bluesky": 1_000,
    "mastodon": 500,
    "newsapi": 100,
    "news": 100,
    "guardian": 100,
    "gnews": 100,
    "currents": 100,
    "mediastack": 100,
    "devto": 500,
}


def _content_type(row: dict) -> str:
    return (row.get("content_type") or "post").lower()


def build_content_breakdown(results: list[dict[str, Any]]) -> dict[str, int]:
    primary = 0
    comments = 0
    replies = 0
    for row in results:
        ct = _content_type(row)
        if ct == "reply":
            replies += 1
        elif ct == "comment" or row.get("is_comment"):
            comments += 1
        else:
            primary += 1
    total = len(results)
    return {
        "primary": primary,
        "comments": comments,
        "replies": replies,
        "total": total,
    }


def build_platform_stats(results: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_platform: dict[str, list[dict]] = defaultdict(list)
    for row in results:
        by_platform[(row.get("platform") or "unknown").lower()].append(row)

    stats: list[dict[str, Any]] = []
    for platform, items in sorted(by_platform.items(), key=lambda x: len(x[1]), reverse=True):
        breakdown = build_content_breakdown(items)
        summary = calculate_sentiment_summary(items)
        eng_scores = []
        for item in items:
            eng = item.get("engagement") or {}
            score = int(eng.get("likes") or 0) + int(eng.get("comments") or 0) + int(eng.get("views") or 0) // 100
            eng_scores.append(score)
        avg_eng = sum(eng_scores) / len(eng_scores) if eng_scores else 0
        if avg_eng >= 1000:
            engagement_level = "high"
        elif avg_eng >= 50:
            engagement_level = "medium"
        elif avg_eng > 0:
            engagement_level = "low"
        else:
            engagement_level = "none"

        stats.append(
            {
                "platform": platform,
                "content_count": len(items),
                "share_pct": 0.0,
                "primary": breakdown["primary"],
                "comments": breakdown["comments"],
                "replies": breakdown["replies"],
                "sentiment": summary,
                "engagement_level": engagement_level,
            }
        )

    total = len(results) or 1
    for s in stats:
        s["share_pct"] = round(s["content_count"] / total * 100, 1)
    return stats


def _split_periods(results: list[dict[str, Any]]) -> tuple[list[dict], list[dict]]:
    """Split results into older vs recent half by posted_at."""
    dated: list[tuple[datetime, dict]] = []
    for row in results:
        posted = row.get("posted_at")
        if not posted:
            continue
        try:
            dt = parse(str(posted))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            dated.append((dt, row))
        except Exception:
            continue
    if len(dated) < 8:
        return results[: len(results) // 2], results[len(results) // 2 :]
    dated.sort(key=lambda x: x[0])
    mid = len(dated) // 2
    older = [r for _, r in dated[:mid]]
    recent = [r for _, r in dated[mid:]]
    return older, recent


def build_period_comparison(
    results: list[dict[str, Any]],
    sentiment_summary: dict[str, float],
) -> dict[str, Any] | None:
    if len(results) < 8:
        return None
    older, recent = _split_periods(results)
    if not older or not recent:
        return None

    old_summary = calculate_sentiment_summary(older)
    recent_summary = calculate_sentiment_summary(recent)
    volume_change_pct = round((len(recent) - len(older)) / max(len(older), 1) * 100, 1)

    if volume_change_pct > 10:
        momentum = "rising"
    elif volume_change_pct < -10:
        momentum = "declining"
    else:
        momentum = "stable"

    neg_delta_pp = round(recent_summary["negative"] - old_summary["negative"], 1)

    return {
        "current_volume": len(recent),
        "previous_volume": len(older),
        "volume_change_pct": volume_change_pct,
        "momentum": momentum,
        "current_sentiment": recent_summary,
        "previous_sentiment": old_summary,
        "negative_change_pp": neg_delta_pp,
        "overall_sentiment": sentiment_summary,
    }


def build_emerging_topics(
    results: list[dict[str, Any]],
    *,
    query: str,
) -> list[dict[str, Any]]:
    if len(results) < 12:
        return []
    older, recent = _split_periods(results)
    old_themes = {t["label"].lower(): t["count"] for t in extract_themes(older, query=query, limit=20)}
    new_themes = extract_themes(recent, query=query, limit=20)

    emerging: list[dict[str, Any]] = []
    for theme in new_themes:
        label = theme["label"]
        recent_count = theme["count"]
        prev_count = old_themes.get(label.lower(), 0)
        if recent_count < 3:
            continue
        if prev_count == 0:
            growth_pct = 100.0 if recent_count >= 3 else 0.0
        else:
            growth_pct = round((recent_count - prev_count) / prev_count * 100, 1)
        if growth_pct < 15 and prev_count > 0:
            continue
        emerging.append(
            {
                "label": label,
                "growth_pct": growth_pct,
                "recent_count": recent_count,
                "previous_count": prev_count,
                "sentiment": theme.get("sentiment"),
                "direction": "up" if growth_pct >= 0 else "down",
            }
        )
    emerging.sort(key=lambda t: abs(t["growth_pct"]), reverse=True)
    return emerging[:6]


def build_confidence(
    results: list[dict[str, Any]],
    platforms_searched: list[str],
    breakdown: dict[str, int],
) -> dict[str, Any]:
    total = breakdown["total"]
    source_count = len({r.get("platform") for r in results if r.get("platform")})
    platform_types = len(set(platforms_searched))

    if total >= 100 and source_count >= 4:
        level = "high"
        explanation = f"{total} analyzed content items across {source_count} platforms."
    elif total >= 30 and source_count >= 2:
        level = "medium"
        explanation = f"{total} items from {source_count} platforms — interpret with moderate caution."
    else:
        level = "low"
        explanation = f"Only {total} relevant items found. Sentiment and trends may not be representative."

    return {
        "level": level,
        "label": level.upper(),
        "explanation": explanation,
        "total_items": total,
        "active_sources": source_count,
        "platform_types": platform_types,
    }


def _safe_engagement_int(value: Any) -> int:
    try:
        return max(0, int(value or 0))
    except (TypeError, ValueError):
        return 0


def _normalized_engagement(row: dict) -> float:
    platform = (row.get("platform") or "unknown").lower()
    eng = row.get("engagement") or {}
    raw = (
        _safe_engagement_int(eng.get("likes"))
        + _safe_engagement_int(eng.get("comments")) * 2
        + _safe_engagement_int(eng.get("shares")) * 3
        + _safe_engagement_int(eng.get("views")) / 1000
    )
    raw = max(0.0, float(raw))
    cap = max(1.0, float(PLATFORM_ENGAGEMENT_CAP.get(platform, 1000)))
    log_cap = math.log1p(cap)
    if log_cap <= 0:
        return 0.0
    return min(1.0, math.log1p(raw) / log_cap)


def build_influential_content(results: list[dict[str, Any]], limit: int = 5) -> list[dict[str, Any]]:
    scored: list[tuple[float, dict]] = []
    now = datetime.now(timezone.utc)
    for row in results:
        relevance = float(row.get("relevance_score") or 0.5)
        eng_norm = _normalized_engagement(row)
        recency = 0.5
        posted = row.get("posted_at")
        if posted:
            try:
                dt = parse(str(posted))
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                hours = max(0.0, (now - dt).total_seconds() / 3600)
                recency = max(0.2, 1.0 - hours / 168)
            except Exception:
                pass
        score = round(eng_norm * 0.5 + relevance * 0.3 + recency * 0.2, 4)
        scored.append((score, row))
    scored.sort(key=lambda x: x[0], reverse=True)
    out = []
    for score, row in scored[:limit]:
        item = dict(row)
        item["influence_score"] = score
        out.append(item)
    return out


def build_search_insights(
    *,
    query: str,
    results: list[dict[str, Any]],
    sentiment_summary: dict[str, float],
    platform_stats: list[dict[str, Any]],
    themes: list[dict[str, Any]],
    period_comparison: dict[str, Any] | None,
    breakdown: dict[str, int],
    youtube_summary: dict[str, Any] | None,
) -> list[dict[str, Any]]:
    insights: list[dict[str, Any]] = []

    dominant = max(
        ("positive", sentiment_summary["positive"]),
        ("neutral", sentiment_summary["neutral"]),
        ("negative", sentiment_summary["negative"]),
        key=lambda x: x[1],
    )
    tone_labels = {
        "positive": "mostly positive",
        "neutral": "mostly neutral",
        "negative": "mostly negative",
    }
    insights.append(
        {
            "type": "sentiment",
            "severity": "warning" if dominant[0] == "negative" and dominant[1] >= 40 else "info",
            "title": f"Overall discussion is {tone_labels[dominant[0]]}",
            "description": f"{dominant[1]:.0f}% of analyzed content is {dominant[0]}.",
            "metric": dominant[1],
        }
    )

    if platform_stats:
        top = platform_stats[0]
        plat = top["platform"].title()
        detail_parts = [f"{top['content_count']} items"]
        if top.get("comments"):
            detail_parts.append(f"{top['comments']} comments")
        if top.get("replies"):
            detail_parts.append(f"{top['replies']} replies")
        insights.append(
            {
                "type": "source",
                "severity": "info",
                "title": f"{plat} is the most active source",
                "description": f"{' · '.join(detail_parts)} analyzed from {plat}.",
            }
        )

    negative_themes = [
        t for t in themes if t.get("mentions", 0) >= THEME_MIN_SAMPLE and t["sentiment"]["negative"] >= 45
    ]
    negative_themes.sort(key=lambda t: t["sentiment"]["negative"], reverse=True)
    if negative_themes:
        t = negative_themes[0]
        insights.append(
            {
                "type": "theme",
                "severity": "warning",
                "title": f"{t['label']} is the most negative theme",
                "description": f"{t['sentiment']['negative']:.0f}% negative across {t['mentions']} mentions.",
            }
        )

    positive_themes = [
        t for t in themes if t.get("mentions", 0) >= THEME_MIN_SAMPLE and t["sentiment"]["positive"] >= 55
    ]
    positive_themes.sort(key=lambda t: t["sentiment"]["positive"], reverse=True)
    if positive_themes:
        t = positive_themes[0]
        insights.append(
            {
                "type": "theme",
                "severity": "positive",
                "title": f"{t['label']} receives positive attention",
                "description": f"{t['sentiment']['positive']:.0f}% positive across {t['mentions']} mentions.",
            }
        )

    if period_comparison and period_comparison.get("momentum") == "rising":
        insights.append(
            {
                "type": "momentum",
                "severity": "info",
                "title": "Conversation activity is rising",
                "description": f"Volume is {period_comparison['volume_change_pct']:+.0f}% higher in the recent half of this period.",
            }
        )
    elif period_comparison and period_comparison.get("momentum") == "declining":
        insights.append(
            {
                "type": "momentum",
                "severity": "info",
                "title": "Conversation activity is declining",
                "description": f"Volume is {period_comparison['volume_change_pct']:+.0f}% compared with the earlier half of this period.",
            }
        )

    if youtube_summary and youtube_summary.get("comments_analyzed", 0) > 0:
        insights.append(
            {
                "type": "youtube",
                "severity": "info",
                "title": "YouTube audience content included",
                "description": (
                    f"{youtube_summary.get('comments_analyzed', 0)} comments and "
                    f"{youtube_summary.get('replies_analyzed', 0)} replies sampled from "
                    f"{youtube_summary.get('videos_analyzed', 0)} videos."
                ),
            }
        )

    if breakdown["total"] < 15:
        return [
            {
                "type": "coverage",
                "severity": "info",
                "title": "Limited data available",
                "description": "Not enough evidence yet to identify strong conversation drivers.",
            }
        ]

    return insights[:5]


def build_why_sentiment_changed(
    themes: list[dict[str, Any]],
    period_comparison: dict[str, Any] | None,
) -> dict[str, Any] | None:
    if not period_comparison:
        return None
    neg_themes = sorted(
        [t for t in themes if t.get("mentions", 0) >= THEME_MIN_SAMPLE],
        key=lambda t: t["sentiment"]["negative"],
        reverse=True,
    )[:3]
    pos_themes = sorted(
        [t for t in themes if t.get("mentions", 0) >= THEME_MIN_SAMPLE],
        key=lambda t: t["sentiment"]["positive"],
        reverse=True,
    )[:2]
    return {
        "negative_change_pp": period_comparison.get("negative_change_pp", 0),
        "previous_negative_pct": period_comparison.get("previous_sentiment", {}).get("negative", 0),
        "current_negative_pct": period_comparison.get("current_sentiment", {}).get("negative", 0),
        "negative_contributors": [
            {"label": t["label"], "mentions": t["mentions"], "negative_pct": t["sentiment"]["negative"]}
            for t in neg_themes
        ],
        "positive_offset": [
            {"label": t["label"], "mentions": t["mentions"], "positive_pct": t["sentiment"]["positive"]}
            for t in pos_themes
        ],
    }


def build_search_intelligence(
    *,
    query: str,
    results: list[dict[str, Any]],
    displayed_count: int,
    sentiment_summary: dict[str, float],
    platforms_searched: list[str],
    youtube_summary: dict[str, Any] | None = None,
) -> dict[str, Any]:
    breakdown = build_content_breakdown(results)
    platform_stats = build_platform_stats(results)
    themes = extract_themes(results, query=query)
    period_comparison = build_period_comparison(results, sentiment_summary)
    confidence = build_confidence(results, platforms_searched, breakdown)
    insights = build_search_insights(
        query=query,
        results=results,
        sentiment_summary=sentiment_summary,
        platform_stats=platform_stats,
        themes=themes,
        period_comparison=period_comparison,
        breakdown=breakdown,
        youtube_summary=youtube_summary,
    )
    emerging = build_emerging_topics(results, query=query)
    influential = build_influential_content(results)
    why_changed = build_why_sentiment_changed(themes, period_comparison)

    most_negative = next(
        (
            t
            for t in sorted(themes, key=lambda x: x["sentiment"]["negative"], reverse=True)
            if t.get("mentions", 0) >= THEME_MIN_SAMPLE and t["sentiment"]["negative"] >= 40
        ),
        None,
    )
    most_positive = next(
        (
            t
            for t in sorted(themes, key=lambda x: x["sentiment"]["positive"], reverse=True)
            if t.get("mentions", 0) >= THEME_MIN_SAMPLE and t["sentiment"]["positive"] >= 50
        ),
        None,
    )

    leading = platform_stats[0] if platform_stats else None
    return {
        "content_breakdown": breakdown,
        "analyzed_total": breakdown["total"],
        "displayed_count": displayed_count,
        "confidence": confidence,
        "platform_stats": platform_stats,
        "themes": themes,
        "most_negative_theme": most_negative,
        "most_positive_theme": most_positive,
        "insights": insights,
        "period_comparison": period_comparison,
        "emerging_topics": emerging,
        "influential_content": influential,
        "why_sentiment_changed": why_changed,
        "leading_platform": leading,
    }
