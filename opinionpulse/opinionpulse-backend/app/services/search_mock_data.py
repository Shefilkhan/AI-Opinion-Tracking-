"""Realistic mock search data for demo mode when API keys are missing."""

from __future__ import annotations

import hashlib
import random
from datetime import datetime, timedelta, timezone

PLATFORMS = ["twitter", "reddit", "youtube", "news"]

POSITIVE_WORDS = {"great", "love", "amazing", "best", "innovation", "hope", "win", "good", "excellent"}
NEGATIVE_WORDS = {"bad", "hate", "worst", "terrible", "fear", "crisis", "fail", "danger", "awful"}


def _seed(query: str) -> int:
    return int(hashlib.md5(query.lower().encode()).hexdigest()[:8], 16)


def score_sentiment(text: str) -> tuple[str, float]:
    lower = text.lower()
    pos = sum(1 for w in POSITIVE_WORDS if w in lower)
    neg = sum(1 for w in NEGATIVE_WORDS if w in lower)
    if pos > neg:
        return "positive", min(0.95, 0.55 + pos * 0.1)
    if neg > pos:
        return "negative", min(0.95, 0.55 + neg * 0.1)
    return "neutral", 0.5


def generate_mock_search(
    query: str,
    platform_filter: str = "all",
    sentiment_filter: str = "all",
    time_range: str = "24h",
    sort_by: str = "recent",
) -> dict:
    rng = random.Random(_seed(query) + hash(platform_filter) + hash(sentiment_filter))
    total = rng.randint(12000, 89000)

    platforms = (
        [platform_filter]
        if platform_filter and platform_filter != "all"
        else PLATFORMS
    )

    authors = {
        "twitter": "@pulse_user",
        "reddit": "u/opinion_tracker",
        "youtube": "TechInsights",
        "news": "Global Desk",
    }
    templates = [
        f"Public discourse around {query} is shifting quickly — analysts note rising engagement.",
        f"Many voices on {query} highlight opportunities, though critics raise valid concerns.",
        f"The conversation about {query} dominated feeds today with strong reactions on both sides.",
        f"Experts weigh in on {query}: sentiment varies by platform and region.",
        f"Breaking: new developments in {query} spark debate across social channels.",
    ]

    results = []
    now = datetime.now(timezone.utc)
    hours_map = {"24h": 24, "7d": 168, "30d": 720}
    max_hours = hours_map.get(time_range, 24)

    for i in range(40):
        plat = rng.choice(platforms)
        content = rng.choice(templates)
        if query.lower() not in content.lower():
            content = f"{content} #{query.replace(' ', '')}"
        label, score = score_sentiment(content)
        if sentiment_filter != "all" and label != sentiment_filter:
            continue
        posted = now - timedelta(hours=rng.randint(0, max_hours), minutes=rng.randint(0, 59))
        likes = rng.randint(10, 15000)
        results.append(
            {
                "id": f"mock-{plat}-{i}",
                "platform": plat,
                "author": f"{authors.get(plat, 'anon')}{rng.randint(1, 999)}",
                "content": content,
                "sentiment": label,
                "sentiment_score": score,
                "engagement": {
                    "likes": likes,
                    "shares": rng.randint(0, likes // 3),
                    "comments": rng.randint(0, likes // 5),
                },
                "url": f"https://example.com/{plat}/{query.replace(' ', '-')}/{i}",
                "posted_at": posted.isoformat(),
            }
        )

    if sort_by == "mentioned":
        results.sort(key=lambda r: r["engagement"]["likes"], reverse=True)
    elif sort_by == "viral":
        results.sort(
            key=lambda r: r["engagement"]["likes"] + r["engagement"]["shares"] * 2,
            reverse=True,
        )
    else:
        results.sort(key=lambda r: r["posted_at"], reverse=True)

    if not results:
        results = generate_mock_search(query, "all", "all", time_range, "recent")["results"][:20]

    pos = sum(1 for r in results if r["sentiment"] == "positive")
    neg = sum(1 for r in results if r["sentiment"] == "negative")
    neu = len(results) - pos - neg
    total_r = len(results) or 1
    summary = {
        "positive": round(pos / total_r * 100, 1),
        "negative": round(neg / total_r * 100, 1),
        "neutral": round(neu / total_r * 100, 1),
    }

    words = query.lower().split() + ["innovation", "future", "debate", "trending", "analysis"]
    keywords = []
    for w in words[:6]:
        keywords.append({"word": w, "count": rng.randint(500, 9000)})
    keywords.sort(key=lambda k: k["count"], reverse=True)

    related = [
        f"#{w.title().replace(' ', '')}"
        for w in (query.split() + ["Trending", "News", "Opinion"])[:5]
    ]

    trend = []
    points = 12 if time_range == "24h" else 7
    for h in range(points):
        t = now - timedelta(hours=(points - h) * (max_hours // points))
        trend.append(
            {
                "time": t.strftime("%H:%M") if time_range == "24h" else t.strftime("%a"),
                "positive": rng.randint(20, 80),
                "negative": rng.randint(10, 50),
                "volume": rng.randint(200, 5000),
            }
        )

    return {
        "query": query,
        "total_results": total,
        "sentiment_summary": summary,
        "platforms_searched": platforms,
        "demo_mode": True,
        "peak_discussion": "Today at 2:00 PM",
        "most_active_platform": "twitter",
        "results": results[:30],
        "trending_keywords": keywords[:10],
        "related_topics": related,
        "sentiment_trend": trend,
    }
