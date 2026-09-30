"""Tests for lightweight theme extraction."""

from app.services.theme_service import extract_themes


def _row(text: str, sentiment: str = "neutral") -> dict:
    return {"title": "", "content": text, "sentiment": sentiment}


def test_extract_themes_filters_stopwords_and_query_term():
    results = [
        _row("institutional adoption is growing for bitcoin holders"),
        _row("people using bitcoin for payments today"),
        _row("institutional adoption news from major banks"),
        _row("wallet security remains important"),
        _row("price movement concerns investors"),
    ] * 3
    themes = extract_themes(results, query="bitcoin", limit=10)
    labels = [t["label"].lower() for t in themes]
    assert "bitcoin" not in labels
    assert "using" not in labels
    assert "people" not in labels
    assert any("institutional" in label for label in labels)


def test_theme_sentiment_percentages():
    results = [
        _row("price movement crash", "negative"),
        _row("price movement drop", "negative"),
        _row("price movement stable", "neutral"),
        _row("price movement rally", "positive"),
    ]
    themes = extract_themes(results, query="crypto", limit=5, min_count=2)
    price = next((t for t in themes if "price" in t["label"].lower()), None)
    assert price is not None
    assert price["sentiment"]["negative"] >= 40
    assert price["mentions"] >= 2


def test_empty_results_returns_empty_themes():
    assert extract_themes([], query="test") == []
