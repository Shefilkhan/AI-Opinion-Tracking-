"""Pure-logic tests (no DB) covering the fixes to core correctness."""
from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.services.sentiment_analysis import analyze_sentiment
from app.services.pulse_metrics import compute_metrics_from_history
from app.services.crisis_narrative_service import _normalize_severity
from app.services.url_validation import is_live_result
from app.services.user_profile_service import validate_username


@pytest.mark.parametrize(
    "text,expected",
    [
        ("government approved the plan", "positive"),   # was wrongly negated
        ("current crisis deepens", "negative"),          # was wrongly positive
        ("investment boom continues", "positive"),       # was wrongly negated
        ("this is a great product", "positive"),
        ("this is not good at all", "negative"),         # real negation still works
    ],
)
def test_sentiment_negation(text, expected):
    assert analyze_sentiment(text)["sentiment"] == expected


def test_first_scan_is_not_a_false_crisis():
    vol, vel, base, quadrant = compute_metrics_from_history(
        [], current_total=5, current_negative=3
    )
    assert quadrant == "quiet"


def test_real_spike_is_still_crisis():
    hist = [(None, 2, 0), (None, 1, 0), (None, 2, 1)]
    _, _, _, quadrant = compute_metrics_from_history(
        hist, current_total=40, current_negative=20
    )
    assert quadrant == "crisis"


@pytest.mark.parametrize(
    "value,expected",
    [("moderate", "medium"), ("severe", "high"), ("critical", "critical"),
     ("bogus", "medium"), (None, "medium"), ("LOW", "low")],
)
def test_crisis_severity_normalization(value, expected):
    assert _normalize_severity(value) == expected


def test_hackernews_external_url_is_live():
    row = {"platform": "hackernews", "url": "https://techcrunch.com/x", "is_demo": False}
    assert is_live_result(row) is True


@pytest.mark.parametrize("name", ["admin", "Billing", "ab"])
def test_reserved_or_invalid_usernames_rejected(name):
    with pytest.raises(HTTPException):
        validate_username(name)


def test_valid_username_allowed():
    validate_username("cool_user1")  # should not raise


def test_hashtag_spam_rejected_for_bitcoin_search():
    from app.services.source_quality import filter_by_relevance, is_spam_or_low_quality

    spam = {
        "title": "#nsfw #nudes #porn #horny #bitcoin",
        "content": (
            "#nsfw #nudes #porn #horny #sexy #onlyfans #xxx #adult "
            "#followme #like4like #bitcoin"
        ),
        "platform": "bluesky",
    }
    assert is_spam_or_low_quality(spam) is True
    assert filter_by_relevance([spam], "bitcoin") == []


def test_bitcoin_prose_passes_relevance():
    from app.services.source_quality import filter_by_relevance, is_spam_or_low_quality

    good = {
        "title": "Bitcoin breaks $65,000 as ETF inflows surge",
        "content": "Bitcoin price rallied today as institutional buyers added exposure.",
        "platform": "newsapi",
    }
    assert is_spam_or_low_quality(good) is False
    filtered = filter_by_relevance([good], "bitcoin")
    assert len(filtered) == 1
    assert filtered[0]["relevance_score"] >= 3


def test_keywords_skip_url_fragments():
    from app.services.keywords_utils import extract_keywords_from_results

    rows = [
        {
            "title": "Bitcoin market update",
            "content": "See https://example.com/chart for live bitcoin prices and crypto news.",
        }
    ]
    words = {k["word"] for k in extract_keywords_from_results(rows)}
    assert "https" not in words
    assert "bitcoin" in words


def test_unrelated_news_filtered_for_bitcoin():
    from app.services.source_quality import filter_by_relevance, matches_search_query

    unrelated = {
        "title": "Judge pauses Paramount Warner deal",
        "content": "Hollywood studios continue merger talks without crypto mention.",
        "platform": "news",
    }
    relevant = {
        "title": "Bitcoin breaks $65,000 as ETF inflows surge",
        "content": "Bitcoin price rallied today as institutional buyers added exposure.",
        "platform": "news",
    }
    assert matches_search_query("bitcoin", unrelated) is False
    assert matches_search_query("bitcoin", relevant) is True
    assert len(filter_by_relevance([unrelated, relevant], "bitcoin")) == 1


def test_multi_word_query_requires_all_terms():
    from app.services.source_quality import matches_search_query

    partial = {
        "title": "Climate summit opens in Geneva",
        "content": "World leaders gather to discuss policy.",
        "platform": "news",
    }
    full = {
        "title": "Climate change policy debate heats up",
        "content": "New climate change regulations proposed in EU.",
        "platform": "news",
    }
    assert matches_search_query("climate change", partial) is False
    assert matches_search_query("climate change", full) is True


def test_query_processor_disambiguates_apple():
    from app.services.query_processor import QueryProcessor

    processor = QueryProcessor()
    result = processor.process("apple")

    assert result["intent"] == "general"
    assert result["cleaned"] == "Apple"
    assert "Apple Inc" in result["expansions"]
    assert '"Apple"' in result["platform_queries"]["newsapi"]
    assert "Apple Inc" in result["platform_queries"]["reddit"]


def test_query_processor_python_technical_intent():
    from app.services.query_processor import QueryProcessor

    processor = QueryProcessor()
    result = processor.process("how to learn python")

    assert result["intent"] == "technical"
    assert "tutorial explained" in result["platform_queries"]["youtube"].lower()


def test_relevance_scorer_filters_irrelevant():
    from app.services.relevance_scorer import filter_and_rank_results, score_result_relevance

    relevant = {
        "title": "Apple Inc stock rises on iPhone news",
        "content": "Apple reported strong earnings for the quarter.",
        "engagement": {"likes": 200, "comments": 10},
        "posted_at": "2026-07-22T10:00:00Z",
    }
    irrelevant = {
        "title": "Microsoft Azure cloud update",
        "content": "Enterprise software news without consumer hardware.",
        "engagement": {"likes": 2},
        "posted_at": "2026-07-22T10:00:00Z",
    }

    assert score_result_relevance(relevant, "Apple") > score_result_relevance(irrelevant, "Apple")
    ranked = filter_and_rank_results([irrelevant, relevant], "Apple", min_score=0.25)
    assert len(ranked) == 1
    assert ranked[0]["title"].startswith("Apple Inc")


def test_search_response_accepts_float_relevance():
    import asyncio

    from app.schemas.search import SearchResponse
    from app.services.search_service import run_search

    data = asyncio.run(run_search("Apple", "all", "24h", "all", "recent"))
    if data["total_results"] == 0:
        return
    response = SearchResponse(**data)
    assert response.total_results > 0
    assert isinstance(response.results[0].relevance_score, float)


def test_extract_cited_sources_maps_numbers():
    from app.services.chat_cited_service import extract_cited_sources

    live = [
        {"platform": "reddit", "title": "BTC rally", "url": "https://reddit.com/1", "author": "u1"},
        {"platform": "news", "title": "Bitcoin news", "url": "https://news.com/2", "author": "editor"},
    ]
    answer = "Sentiment is positive [1] with strong news coverage [2][1]."
    cited = extract_cited_sources(answer, live)

    assert len(cited) == 2
    assert cited[0]["number"] == 1
    assert cited[0]["url"] == "https://reddit.com/1"
    assert cited[1]["number"] == 2

