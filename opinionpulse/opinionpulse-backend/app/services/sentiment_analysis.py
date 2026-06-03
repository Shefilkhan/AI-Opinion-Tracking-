"""Keyword-based sentiment scoring for search results."""

from __future__ import annotations

POSITIVE_WORDS = frozenset(
    {
        "good",
        "great",
        "excellent",
        "amazing",
        "awesome",
        "fantastic",
        "love",
        "best",
        "incredible",
        "outstanding",
        "brilliant",
        "perfect",
        "happy",
        "excited",
        "growth",
        "profit",
        "win",
        "success",
        "bullish",
        "up",
        "rise",
        "gain",
        "positive",
        "strong",
        "boom",
        "surge",
        "innovation",
        "revolutionary",
        "promising",
        "optimistic",
        "support",
        "milestone",
        "record",
        "adoption",
        "trusted",
        "secure",
        "future",
        "bullish",
    }
)

NEGATIVE_WORDS = frozenset(
    {
        "bad",
        "terrible",
        "awful",
        "horrible",
        "worst",
        "hate",
        "scam",
        "fraud",
        "crash",
        "fail",
        "failure",
        "loss",
        "bearish",
        "down",
        "drop",
        "fall",
        "decline",
        "negative",
        "weak",
        "bust",
        "collapse",
        "risk",
        "danger",
        "problem",
        "issue",
        "concern",
        "worried",
        "fear",
        "panic",
        "bubble",
        "volatile",
        "unstable",
        "ban",
        "illegal",
        "hack",
        "stolen",
        "lost",
        "debt",
        "crisis",
        "warning",
        "threat",
        "dump",
        "disaster",
        "dangerous",
        "compromised",
        "criticism",
    }
)


def analyze_sentiment(text: str) -> dict:
    words = text.lower().split()
    positive_count = 0
    negative_count = 0

    for word in words:
        clean = "".join(c for c in word if c.isalpha())
        if not clean:
            continue
        if clean in POSITIVE_WORDS:
            positive_count += 1
        if clean in NEGATIVE_WORDS:
            negative_count += 1

    total = positive_count + negative_count
    if total == 0:
        return {"sentiment": "neutral", "score": 0.0}

    score = (positive_count - negative_count) / total

    if score > 0.1:
        return {"sentiment": "positive", "score": round(score, 3)}
    if score < -0.1:
        return {"sentiment": "negative", "score": round(score, 3)}
    return {"sentiment": "neutral", "score": round(score, 3)}


def calculate_sentiment_summary(results: list[dict]) -> dict:
    total = len(results)
    if total == 0:
        return {"positive": 0, "negative": 0, "neutral": 100}

    positive = sum(1 for r in results if r.get("sentiment") == "positive")
    negative = sum(1 for r in results if r.get("sentiment") == "negative")
    neutral = sum(1 for r in results if r.get("sentiment") == "neutral")

    return {
        "positive": round((positive / total) * 100),
        "negative": round((negative / total) * 100),
        "neutral": round((neutral / total) * 100),
    }


def apply_sentiment_to_results(results: list[dict]) -> list[dict]:
    out = []
    for row in results:
        item = dict(row)
        analysis = analyze_sentiment(item.get("content", ""))
        item["sentiment"] = analysis["sentiment"]
        item["sentiment_score"] = analysis["score"]
        out.append(item)
    return out
