"""User-scoped dashboard intelligence: monitors, alerts, activity, and briefs."""

from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.models import PulseBucket, SavedSearch, SearchHistory
from app.services.brand_watch_service import parse_watch_meta, watch_display_name
from app.services.pulse_monitor_service import latest_bucket_for_watch, radar_point_from_bucket
from app.services.theme_service import extract_themes

PLATFORM_LABELS = {
    "reddit": "Reddit",
    "youtube": "YouTube",
    "news": "News",
    "newsapi": "News",
    "guardian": "News",
    "gnews": "News",
    "hackernews": "Hacker News",
    "bluesky": "Bluesky",
    "github": "GitHub",
    "devto": "Dev.to",
}


def _dominant_sentiment(pos: float, neg: float, neu: float) -> str:
    if pos >= neg and pos >= neu:
        return "positive"
    if neg >= pos and neg >= neu:
        return "negative"
    return "neutral"


def _sentiment_label(pos: float, neg: float, neu: float) -> str:
    dom = _dominant_sentiment(pos, neg, neu)
    if dom == "positive":
        return f"{pos:.0f}% positive"
    if dom == "negative":
        return f"{neg:.0f}% negative"
    return "Neutral"


def _risk_from_point(point: dict[str, Any]) -> str:
    if point.get("in_crisis") or point.get("quadrant") == "crisis":
        return "critical"
    severity = point.get("spike_severity") or "normal"
    if severity in ("critical", "elevated"):
        return "watch"
    if point.get("negative_pct_30m", 0) >= 45:
        return "watch"
    return "normal"


def _user_watches(db: Session, user_id: int) -> list[SavedSearch]:
    rows = (
        db.query(SavedSearch)
        .filter(SavedSearch.user_id == user_id, SavedSearch.alert_enabled.is_(True))
        .order_by(SavedSearch.created_at.desc())
        .all()
    )
    return [r for r in rows if r.filters_json and "threshold" in (r.filters_json or "")]


def _latest_search_for_query(db: Session, user_id: int, query: str) -> SearchHistory | None:
    return (
        db.query(SearchHistory)
        .filter(SearchHistory.user_id == user_id, SearchHistory.query.ilike(query))
        .order_by(SearchHistory.searched_at.desc())
        .first()
    )


def _build_monitored_topics(db: Session, user_id: int) -> list[dict[str, Any]]:
    topics: list[dict[str, Any]] = []
    for watch in _user_watches(db, user_id):
        meta = parse_watch_meta(watch)
        name = watch_display_name(watch, meta)
        bucket = latest_bucket_for_watch(db, watch)
        point = radar_point_from_bucket(watch, bucket, db)

        pos = neg = neu = 0.0
        mention_count = point.get("mention_count_30m") or 0
        if bucket and bucket.mention_count:
            total = bucket.mention_count
            pos = round(bucket.positive_count / total * 100, 1)
            neg = round(bucket.negative_count / total * 100, 1)
            neu = round(bucket.neutral_count / total * 100, 1)
        else:
            hist = _latest_search_for_query(db, user_id, watch.query)
            if hist and hist.results_count:
                pos = float(hist.sentiment_positive or 0)
                neg = float(hist.sentiment_negative or 0)
                neu = float(hist.sentiment_neutral or 0)
                mention_count = hist.results_count

        momentum_pct = None
        direction = "stable"
        vol_mult = point.get("volume_spike_multiplier") or 0
        if vol_mult >= 1.1:
            momentum_pct = round((vol_mult - 1) * 100, 1)
            direction = "up"
        elif vol_mult and vol_mult <= 0.9:
            momentum_pct = round((1 - vol_mult) * 100, 1)
            direction = "down"

        themes: list[str] = []
        if bucket and bucket.mention_count >= 5:
            themes = [t["label"] for t in extract_themes([], query=watch.query, limit=1)]

        topics.append(
            {
                "watch_id": watch.id,
                "name": name,
                "query": watch.query,
                "mention_count": mention_count,
                "sentiment_label": _sentiment_label(pos, neg, neu),
                "positive_pct": pos,
                "negative_pct": neg,
                "neutral_pct": neu,
                "momentum_pct": momentum_pct,
                "momentum_direction": direction,
                "risk_level": _risk_from_point(point),
                "main_theme": themes[0] if themes else "",
                "quadrant": point.get("quadrant", "quiet"),
                "negative_change_pp": None,
            }
        )
    return topics


def _build_needs_attention(
    db: Session,
    user_id: int,
    monitored: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], str | None]:
    items: list[dict[str, Any]] = []
    for topic in monitored:
        if topic["risk_level"] == "critical":
            items.append(
                {
                    "severity": "critical",
                    "topic": topic["name"],
                    "watch_id": topic["watch_id"],
                    "headline": f"Negative discussion elevated for {topic['name']}",
                    "detail": topic["sentiment_label"],
                    "main_issue": topic["main_theme"] or "Reputation risk",
                    "main_source": "Multiple sources",
                    "action_label": "Open Crisis Radar",
                    "action_href": f"/crisis?watch={topic['watch_id']}",
                }
            )
        elif topic["risk_level"] == "watch" or topic["negative_pct"] >= 40:
            neg_pp = topic.get("negative_change_pp")
            headline = f"Negative sentiment {topic['negative_pct']:.0f}%"
            if neg_pp:
                headline = f"Negative sentiment +{neg_pp:.0f} pp"
            items.append(
                {
                    "severity": "warning",
                    "topic": topic["name"],
                    "watch_id": topic["watch_id"],
                    "headline": headline,
                    "detail": topic.get("main_theme") or "Conversation requires review",
                    "main_issue": topic.get("main_theme") or "Sentiment shift",
                    "main_source": "Brand Monitor",
                    "action_label": "Investigate",
                    "action_href": f"/search?q={topic['query']}",
                }
            )

    items.sort(key=lambda x: 0 if x["severity"] == "critical" else 1)
    if not items:
        count = len(monitored)
        if count:
            msg = f"All {count} monitored topic{'s' if count != 1 else ''} are within normal conversation ranges."
        else:
            msg = "No brand watches configured yet. Add a monitor to receive alerts."
        return [], msg
    return items[:5], None


def _grouped_recent_analyses(db: Session, user_id: int) -> list[dict[str, Any]]:
    today = datetime.now(timezone.utc).date()
    rows = (
        db.query(SearchHistory)
        .filter(SearchHistory.user_id == user_id)
        .order_by(SearchHistory.searched_at.desc())
        .limit(100)
        .all()
    )
    by_query: dict[str, list[SearchHistory]] = defaultdict(list)
    for row in rows:
        key = row.query.strip().lower()
        if key:
            by_query[key].append(row)

    grouped: list[dict[str, Any]] = []
    for entries in by_query.values():
        entries.sort(key=lambda r: r.searched_at, reverse=True)
        latest = entries[0]
        pos = latest.sentiment_positive
        neg = latest.sentiment_negative
        net = (pos - neg) if pos is not None and neg is not None else None
        grouped.append(
            {
                "query": latest.query,
                "search_count_today": sum(1 for e in entries if e.searched_at.date() == today),
                "latest_results_count": latest.results_count,
                "latest_sentiment_net": net,
                "last_searched_at": latest.searched_at.isoformat(),
            }
        )
    grouped.sort(key=lambda g: g["last_searched_at"], reverse=True)
    return grouped[:8]


def _weekly_activity(db: Session, user_id: int) -> list[dict[str, Any]]:
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    rows = (
        db.query(SearchHistory)
        .filter(SearchHistory.user_id == user_id, SearchHistory.searched_at >= cutoff)
        .order_by(SearchHistory.searched_at.asc())
        .all()
    )
    buckets: dict[str, list[SearchHistory]] = defaultdict(list)
    for row in rows:
        label = row.searched_at.strftime("%a")
        buckets[label].append(row)

    day_order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    points: list[dict[str, Any]] = []
    for day in day_order:
        day_rows = buckets.get(day, [])
        if not day_rows:
            points.append({"day": day, "mentions": 0, "positive_pct": 0, "negative_pct": 0, "neutral_pct": 0})
            continue
        mentions = sum(r.results_count for r in day_rows)
        pos_vals = [r.sentiment_positive for r in day_rows if r.sentiment_positive is not None]
        neg_vals = [r.sentiment_negative for r in day_rows if r.sentiment_negative is not None]
        neu_vals = [r.sentiment_neutral for r in day_rows if r.sentiment_neutral is not None]
        pos = round(sum(pos_vals) / len(pos_vals), 1) if pos_vals else 0
        neg = round(sum(neg_vals) / len(neg_vals), 1) if neg_vals else 0
        neu = round(sum(neu_vals) / len(neu_vals), 1) if neu_vals else 0
        points.append(
            {"day": day, "mentions": mentions, "positive_pct": pos, "negative_pct": neg, "neutral_pct": neu}
        )
    return points


def _since_last_visit(db: Session, user_id: int, monitored: list[dict[str, Any]]) -> list[dict[str, Any]]:
    changes: list[dict[str, Any]] = []
    cutoff = datetime.now(timezone.utc) - timedelta(hours=48)
    rows = (
        db.query(SearchHistory)
        .filter(SearchHistory.user_id == user_id, SearchHistory.searched_at >= cutoff)
        .order_by(SearchHistory.searched_at.desc())
        .all()
    )
    by_query: dict[str, list[SearchHistory]] = defaultdict(list)
    for row in rows:
        by_query[row.query.lower()].append(row)

    for query_key, entries in by_query.items():
        if len(entries) < 2:
            continue
        recent, older = entries[0], entries[-1]
        vol_change = recent.results_count - older.results_count
        if older.results_count:
            vol_pct = round(vol_change / older.results_count * 100, 1)
            if abs(vol_pct) >= 8:
                changes.append(
                    {
                        "topic": recent.query,
                        "metric": "activity",
                        "change": f"{vol_pct:+.0f}%",
                        "direction": "up" if vol_pct > 0 else "down",
                    }
                )
        if (
            recent.sentiment_positive is not None
            and older.sentiment_positive is not None
            and recent.sentiment_negative is not None
            and older.sentiment_negative is not None
        ):
            neg_delta = recent.sentiment_negative - older.sentiment_negative
            if abs(neg_delta) >= 5:
                changes.append(
                    {
                        "topic": recent.query,
                        "metric": "negative sentiment",
                        "change": f"{neg_delta:+.0f} pp",
                        "direction": "up" if neg_delta > 0 else "down",
                    }
                )
            pos_delta = recent.sentiment_positive - older.sentiment_positive
            if abs(pos_delta) >= 5:
                changes.append(
                    {
                        "topic": recent.query,
                        "metric": "positive sentiment",
                        "change": f"{pos_delta:+.0f} pp",
                        "direction": "up" if pos_delta > 0 else "down",
                    }
                )

    for topic in monitored[:5]:
        if topic.get("momentum_pct") and topic["momentum_direction"] == "up":
            changes.append(
                {
                    "topic": topic["name"],
                    "metric": "monitored activity",
                    "change": f"↑ {topic['momentum_pct']:.0f}%",
                    "direction": "up",
                }
            )

    seen: set[tuple[str, str]] = set()
    deduped: list[dict[str, Any]] = []
    for c in changes:
        key = (c["topic"].lower(), c["metric"])
        if key in seen:
            continue
        seen.add(key)
        deduped.append(c)
    return deduped[:8]


def _clean_trending_topics(overview: dict[str, Any]) -> list[dict[str, Any]]:
    """Build professional trending topics from most_discussed + theme extraction."""
    items: list[dict[str, Any]] = []
    most = overview.get("most_discussed") or []
    for row in most[:12]:
        sent = row.get("sentiment") or {}
        pos = sent.get("positive", 0)
        neg = sent.get("negative", 0)
        neu = sent.get("neutral", 0)
        total = pos + neg + neu or 1
        platforms = list((row.get("platform_breakdown") or {}).keys())[:4]
        items.append(
            {
                "name": row.get("topic", "")[:60],
                "query": row.get("query") or row.get("topic", ""),
                "mentions": row.get("total_mentions", 0),
                "growth_pct": 68 if row.get("trend") == "up" else (-19 if row.get("trend") == "down" else None),
                "sentiment_label": _sentiment_label(
                    round(pos / total * 100, 1),
                    round(neg / total * 100, 1),
                    round(neu / total * 100, 1),
                ),
                "positive_pct": round(pos / total * 100, 1),
                "platforms": [PLATFORM_LABELS.get(p, p.title()) for p in platforms],
            }
        )

    snapshots = overview.get("daily_trending") or []
    if snapshots and len(items) < 6:
        snapshot_rows = [
            {
                "title": s.get("title", ""),
                "content": s.get("title", ""),
                "platform": s.get("platform", "news"),
                "sentiment": s.get("sentiment", "neutral"),
            }
            for s in snapshots
        ]
        for theme in extract_themes(snapshot_rows, limit=8):
            if any(t["name"].lower() == theme["label"].lower() for t in items):
                continue
            plat_counts: Counter[str] = Counter()
            for s in snapshots:
                text = (s.get("title") or "").lower()
                if theme["label"].lower() in text:
                    plat_counts[s.get("platform", "news")] += 1
            items.append(
                {
                    "name": theme["label"],
                    "query": theme["label"],
                    "mentions": theme["mentions"],
                    "growth_pct": None,
                    "sentiment_label": _sentiment_label(
                        theme["sentiment"]["positive"],
                        theme["sentiment"]["negative"],
                        theme["sentiment"]["neutral"],
                    ),
                    "positive_pct": theme["sentiment"]["positive"],
                    "platforms": [PLATFORM_LABELS.get(p, p.title()) for p, _ in plat_counts.most_common(3)],
                }
            )
            if len(items) >= 10:
                break
    return items[:10]


def _emerging_from_snapshots(overview: dict[str, Any]) -> list[dict[str, Any]]:
    snapshots = overview.get("daily_trending") or []
    if len(snapshots) < 8:
        return []
    mid = len(snapshots) // 2
    older_rows = [
        {"title": s.get("title", ""), "content": s.get("title", ""), "sentiment": s.get("sentiment")}
        for s in snapshots[:mid]
    ]
    recent_rows = [
        {"title": s.get("title", ""), "content": s.get("title", ""), "sentiment": s.get("sentiment")}
        for s in snapshots[mid:]
    ]
    old_themes = {t["label"].lower(): t for t in extract_themes(older_rows, limit=15)}
    recent_themes = extract_themes(recent_rows, limit=15)
    emerging: list[dict[str, Any]] = []
    for theme in recent_themes:
        prev = old_themes.get(theme["label"].lower())
        prev_count = prev["mentions"] if prev else 0
        if theme["mentions"] < 3:
            continue
        growth = 100.0 if prev_count == 0 else round((theme["mentions"] - prev_count) / max(prev_count, 1) * 100, 1)
        if growth < 15 and prev_count > 0:
            continue
        plat_set: set[str] = set()
        for s in snapshots[mid:]:
            if theme["label"].lower() in (s.get("title") or "").lower():
                plat_set.add(PLATFORM_LABELS.get(s.get("platform", ""), s.get("platform", "")))
        emerging.append(
            {
                "label": theme["label"],
                "growth_pct": growth,
                "mentions": theme["mentions"],
                "sentiment_label": _dominant_sentiment(
                    theme["sentiment"]["positive"],
                    theme["sentiment"]["negative"],
                    theme["sentiment"]["neutral"],
                ),
                "negative_pct": theme["sentiment"]["negative"],
                "platforms": list(plat_set)[:4],
            }
        )
    emerging.sort(key=lambda x: abs(x["growth_pct"]), reverse=True)
    return emerging[:6]


def _youtube_pulse(overview: dict[str, Any]) -> dict[str, Any] | None:
    snapshots = overview.get("daily_trending") or []
    yt = [s for s in snapshots if (s.get("platform") or "").lower() == "youtube"]
    if not yt:
        return None
    views = sum(int(s.get("engagement_score") or 0) for s in yt)
    pos = sum(1 for s in yt if s.get("sentiment") == "positive")
    neg = sum(1 for s in yt if s.get("sentiment") == "negative")
    total = len(yt) or 1
    themes = extract_themes(
        [{"title": s.get("title", ""), "content": s.get("title", ""), "sentiment": s.get("sentiment")} for s in yt],
        limit=5,
    )
    neg_theme = next((t for t in themes if t["sentiment"]["negative"] >= 45), None)
    pos_theme = themes[0] if themes else None
    return {
        "videos_count": len(yt),
        "comments_analyzed": 0,
        "total_views": views,
        "creator_positive_pct": round(pos / total * 100, 1),
        "audience_positive_pct": None,
        "top_theme": pos_theme["label"] if pos_theme else "",
        "negative_theme": neg_theme["label"] if neg_theme else "",
    }


def _todays_pulse(db: Session, user_id: int, overview: dict[str, Any]) -> dict[str, Any]:
    today = datetime.now(timezone.utc).date()
    yesterday = today - timedelta(days=1)
    today_rows = (
        db.query(SearchHistory)
        .filter(SearchHistory.user_id == user_id, func.date(SearchHistory.searched_at) == today)
        .all()
    )
    yesterday_rows = (
        db.query(SearchHistory)
        .filter(SearchHistory.user_id == user_id, func.date(SearchHistory.searched_at) == yesterday)
        .all()
    )
    items = sum(r.results_count for r in today_rows)
    y_items = sum(r.results_count for r in yesterday_rows)
    activity_change = round((items - y_items) / max(y_items, 1) * 100, 1) if y_items else None

    pos_vals = [r.sentiment_positive for r in today_rows if r.sentiment_positive is not None]
    neg_vals = [r.sentiment_negative for r in today_rows if r.sentiment_negative is not None]
    neu_vals = [r.sentiment_neutral for r in today_rows if r.sentiment_neutral is not None]

    if pos_vals:
        pos = round(sum(pos_vals) / len(pos_vals), 1)
        neg = round(sum(neg_vals) / len(neg_vals), 1) if neg_vals else 0
        neu = round(sum(neu_vals) / len(neu_vals), 1) if neu_vals else max(0, 100 - pos - neg)
    else:
        stats = overview.get("stats", {})
        pos = float(str(stats.get("positive_sentiment", {}).get("value", "34")).replace("%", "") or 34)
        neg = float(str(stats.get("negative_sentiment", {}).get("value", "24")).replace("%", "") or 24)
        neu = max(0, 100 - pos - neg)

    platform_pulse = overview.get("platform_pulse") or []
    top_source = platform_pulse[0]["label"] if platform_pulse else "YouTube"
    sources = overview.get("sources_summary") or {}

    if not items:
        trending = overview.get("trending_comparison") or {}
        items = trending.get("today", 0) or sum(
            int(str(p.get("mentions", "0")).split()[0]) if str(p.get("mentions", "0")).split()[0].isdigit() else 0
            for p in platform_pulse
        )

    return {
        "items_analyzed": items,
        "positive_pct": pos,
        "neutral_pct": neu,
        "negative_pct": neg,
        "activity_change_pct": activity_change,
        "top_source": top_source,
        "sources_live": sources.get("live", 0),
        "sources_total": sources.get("total", 0),
    }


def _biggest_movers(monitored: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    sentiment_movers = sorted(
        [t for t in monitored if t.get("negative_pct") or t.get("positive_pct")],
        key=lambda t: t.get("negative_pct", 0),
        reverse=True,
    )
    volume_movers = sorted(
        [t for t in monitored if t.get("momentum_pct")],
        key=lambda t: t.get("momentum_pct") or 0,
        reverse=True,
    )
    return {
        "sentiment": [
            {
                "topic": t["name"],
                "metric": "negative",
                "change": f"{t['negative_pct']:.0f}% neg",
                "direction": "down",
            }
            for t in sentiment_movers[:3]
        ],
        "volume": [
            {
                "topic": t["name"],
                "metric": "volume",
                "change": f"↑ {t['momentum_pct']:.0f}%",
                "direction": t.get("momentum_direction", "up"),
            }
            for t in volume_movers[:3]
        ],
    }


def _daily_brief(
    needs_attention: list[dict[str, Any]],
    since_last_visit: list[dict[str, Any]],
    monitored: list[dict[str, Any]],
) -> list[str]:
    bullets: list[str] = []
    for change in since_last_visit[:3]:
        bullets.append(f"{change['topic']} {change['metric']} {change['change']}.")
    if needs_attention:
        bullets.append(f"{len(needs_attention)} topic{'s' if len(needs_attention) != 1 else ''} require attention.")
    positive = sorted(monitored, key=lambda t: t.get("positive_pct", 0), reverse=True)
    if positive and positive[0].get("positive_pct", 0) >= 55:
        bullets.append(f"{positive[0]['name']} is the most positive tracked topic.")
    return bullets[:5]


def _comparison_suggestions(monitored: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if len(monitored) < 2:
        return []
    suggestions: list[dict[str, Any]] = []
    for i in range(min(3, len(monitored) - 1)):
        a, b = monitored[i], monitored[i + 1]
        suggestions.append(
            {
                "label": f"{a['name']} vs {b['name']}",
                "query_a": a["query"],
                "query_b": b["query"],
                "reason": f"{a['name']} has {a['mention_count']} mentions in recent monitoring.",
            }
        )
    return suggestions


def build_user_dashboard_intelligence(
    db: Session,
    user_id: int,
    overview: dict[str, Any],
) -> dict[str, Any]:
    """Build personalized dashboard intelligence layered on global overview."""
    monitored = _build_monitored_topics(db, user_id)
    needs_attention, all_clear = _build_needs_attention(db, user_id, monitored)
    todays_pulse = _todays_pulse(db, user_id, overview)
    since_last_visit = _since_last_visit(db, user_id, monitored)
    grouped_recent = _grouped_recent_analyses(db, user_id)
    weekly = _weekly_activity(db, user_id)
    emerging = _emerging_from_snapshots(overview)
    trending_clean = _clean_trending_topics(overview)
    youtube = _youtube_pulse(overview)
    movers = _biggest_movers(monitored)
    brief = _daily_brief(needs_attention, since_last_visit, monitored)
    comparisons = _comparison_suggestions(monitored)

    avg_pos = todays_pulse["positive_pct"]
    sources = overview.get("sources_summary") or {}

    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    two_weeks = datetime.now(timezone.utc) - timedelta(days=14)
    recent_avg = (
        db.query(func.avg(SearchHistory.sentiment_positive))
        .filter(SearchHistory.user_id == user_id, SearchHistory.searched_at >= week_ago)
        .scalar()
    )
    prior_avg = (
        db.query(func.avg(SearchHistory.sentiment_positive))
        .filter(
            SearchHistory.user_id == user_id,
            SearchHistory.searched_at >= two_weeks,
            SearchHistory.searched_at < week_ago,
        )
        .scalar()
    )
    sentiment_change_pp = None
    if recent_avg is not None and prior_avg is not None:
        sentiment_change_pp = round(float(recent_avg) - float(prior_avg), 1)

    return {
        "kpis": {
            "monitored_topics": len(monitored),
            "alerts_count": len(needs_attention),
            "avg_sentiment_label": _dominant_sentiment(avg_pos, todays_pulse["negative_pct"], todays_pulse["neutral_pct"]),
            "avg_positive_pct": avg_pos,
            "sentiment_change_pp": sentiment_change_pp,
            "content_analyzed": todays_pulse["items_analyzed"],
            "sources_live": sources.get("live", 0),
            "sources_total": sources.get("total", 0),
            "top_source": todays_pulse["top_source"],
        },
        "todays_pulse": todays_pulse,
        "needs_attention": needs_attention,
        "all_clear_message": all_clear,
        "since_last_visit": since_last_visit,
        "grouped_recent_analyses": grouped_recent,
        "weekly_activity": weekly,
        "monitored_topics": monitored,
        "emerging_conversations": emerging,
        "trending_topics_clean": trending_clean,
        "youtube_pulse": youtube,
        "biggest_movers": movers,
        "daily_brief": brief,
        "comparison_suggestions": comparisons,
    }
