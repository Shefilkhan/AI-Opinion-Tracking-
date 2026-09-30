"""Tests for search analytics intelligence builders."""

from app.services.search_analytics_service import (
    build_content_breakdown,
    build_confidence,
    build_influential_content,
    build_period_comparison,
    build_search_insights,
    build_search_intelligence,
)


def _row(
    *,
    platform: str = "reddit",
    sentiment: str = "neutral",
    content_type: str = "post",
    title: str = "",
    content: str = "",
    posted_at: str = "2026-08-10T12:00:00Z",
    relevance_score: float = 0.8,
) -> dict:
    return {
        "platform": platform,
        "sentiment": sentiment,
        "content_type": content_type,
        "title": title,
        "content": content,
        "posted_at": posted_at,
        "relevance_score": relevance_score,
        "engagement": {"likes": 10, "comments": 2},
    }


def test_content_breakdown_counts_types():
    rows = [
        _row(content_type="video"),
        _row(content_type="post"),
        _row(content_type="comment", is_comment=True),
        _row(content_type="reply"),
    ]
    breakdown = build_content_breakdown(rows)
    assert breakdown["primary"] == 2
    assert breakdown["comments"] == 1
    assert breakdown["replies"] == 1
    assert breakdown["total"] == 4


def test_confidence_low_for_sparse_data():
    rows = [_row() for _ in range(5)]
    breakdown = build_content_breakdown(rows)
    conf = build_confidence(rows, ["reddit"], breakdown)
    assert conf["level"] == "low"
    assert "Only 5" in conf["explanation"]


def test_confidence_high_for_broad_sample():
    rows = [_row(platform=f"p{i % 5}") for i in range(120)]
    breakdown = build_content_breakdown(rows)
    conf = build_confidence(rows, ["reddit", "youtube", "news", "github"], breakdown)
    assert conf["level"] == "high"


def test_period_comparison_requires_minimum_rows():
    rows = [_row() for _ in range(6)]
    assert build_period_comparison(rows, {"positive": 30, "neutral": 50, "negative": 20}) is None


def test_period_comparison_momentum_rising():
    older = [_row(posted_at=f"2026-08-09T{h:02d}:00:00Z") for h in range(8)]
    recent = [_row(posted_at=f"2026-08-10T{h:02d}:00:00Z") for h in range(16)]
    summary = {"positive": 30, "neutral": 50, "negative": 20}
    comp = build_period_comparison(older + recent, summary)
    assert comp is not None
    assert comp["momentum"] == "rising"
    assert comp["volume_change_pct"] > 0


def test_search_insights_limited_data_message():
    rows = [_row() for _ in range(8)]
    breakdown = build_content_breakdown(rows)
    insights = build_search_insights(
        query="bitcoin",
        results=rows,
        sentiment_summary={"positive": 10, "neutral": 70, "negative": 20},
        platform_stats=[],
        themes=[],
        period_comparison=None,
        breakdown=breakdown,
        youtube_summary=None,
    )
    assert len(insights) == 1
    assert insights[0]["title"] == "Limited data available"


def test_build_search_intelligence_includes_themes_and_platforms():
    rows = [
        _row(platform="youtube", content_type="video", title="ETF inflows surge", content="institutional adoption grows"),
        _row(platform="youtube", content_type="comment", content="price movement looks bearish"),
        _row(platform="reddit", content="regulation debate continues"),
        _row(platform="news", content_type="article", title="Crypto regulation update"),
    ] * 8
    intel = build_search_intelligence(
        query="bitcoin",
        results=rows,
        displayed_count=40,
        sentiment_summary={"positive": 25, "neutral": 55, "negative": 20},
        platforms_searched=["youtube", "reddit", "news"],
    )
    assert intel["content_breakdown"]["total"] == len(rows)
    assert intel["analyzed_total"] == len(rows)
    assert intel["displayed_count"] == 40
    assert len(intel["platform_stats"]) >= 2
    assert intel["leading_platform"]["platform"] == "youtube"
    assert isinstance(intel["insights"], list)


def test_influential_content_handles_negative_engagement():
    rows = [
        {
            "platform": "youtube",
            "sentiment": "neutral",
            "content": "test",
            "engagement": {"likes": -10, "views": -5000, "comments": "bad"},
            "relevance_score": 0.5,
        }
    ]
    result = build_influential_content(rows)
    assert len(result) == 1
    assert result[0]["influence_score"] >= 0
