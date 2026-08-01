"""Tests for topic summary generation."""

from __future__ import annotations

from app.services.topic_summary_service import build_topic_summary


def test_build_topic_summary_with_results():
    summary = build_topic_summary(
        query="odyssey",
        results=[
            {
                "title": "Christopher Nolan Odyssey IMAX review",
                "content": "Early reactions praise the cinematography.",
                "platform": "reddit",
            },
            {
                "title": "Odyssey ticket sales break records",
                "content": "Box office analysts are surprised.",
                "platform": "newsapi",
            },
        ],
        sentiment_summary={"positive": 62, "negative": 18, "neutral": 20},
        platforms_searched=["reddit", "newsapi", "youtube"],
        most_active_platform="reddit",
        trending_keywords=[
            {"word": "odyssey", "count": 120},
            {"word": "imax", "count": 24},
        ],
        wiki_summary={
            "title": "Odyssey",
            "summary": "The Odyssey is one of two major ancient Greek epic poems.",
            "url": "https://en.wikipedia.org/wiki/Odyssey",
        },
        total_results=38,
    )

    assert summary["query"] == "odyssey"
    assert "Odyssey is one of two major" in summary["overview"]
    assert "38 live mentions" in summary["overview"]
    assert summary["sentiment_tone"] == "largely positive"
    assert len(summary["highlights"]) >= 1
    assert "odyssey" in summary["top_keywords"]


def test_build_topic_summary_empty_results_with_wiki():
    summary = build_topic_summary(
        query="obscure topic",
        results=[],
        sentiment_summary={"positive": 0, "negative": 0, "neutral": 0},
        platforms_searched=[],
        most_active_platform=None,
        trending_keywords=[],
        wiki_summary={
            "title": "Obscure Topic",
            "summary": "A short encyclopedia definition.",
            "url": "https://en.wikipedia.org/wiki/Obscure",
        },
        total_results=0,
    )

    assert "A short encyclopedia definition." in summary["overview"]
    assert summary["total_mentions"] == 0
