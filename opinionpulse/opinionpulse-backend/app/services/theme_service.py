"""Lightweight theme extraction from search results."""

from __future__ import annotations

import re
from collections import Counter, defaultdict
from typing import Any

from app.services.keywords_utils import STOPWORDS

THEME_MIN_SAMPLE = 5

NOISE_TERMS = STOPWORDS | frozenset(
    {
        "using",
        "data",
        "private",
        "million",
        "people",
        "video",
        "today",
        "one",
        "comment",
        "reply",
        "post",
        "article",
        "source",
        "http",
        "https",
        "www",
        "com",
        "would",
        "could",
        "really",
        "think",
        "know",
        "make",
        "made",
        "much",
        "many",
        "still",
        "even",
        "well",
        "back",
        "first",
        "last",
        "year",
        "years",
        "time",
        "news",
        "read",
        "see",
        "look",
        "going",
        "thing",
        "things",
        "right",
        "left",
        "need",
        "want",
        "user",
        "users",
    }
)

_URL_RE = re.compile(r"https?://\S+|www\.\S+", re.IGNORECASE)


def _normalize_text(text: str) -> str:
    text = _URL_RE.sub(" ", text.lower())
    text = re.sub(r"[^\w\s'-]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _query_terms(query: str) -> set[str]:
    return {t.lower() for t in re.findall(r"[a-z0-9]{3,}", query.lower())}


def _tokens(text: str) -> list[str]:
    return re.findall(r"[a-z]{3,}", text)


def _bigrams(tokens: list[str]) -> list[str]:
    return [f"{tokens[i]} {tokens[i + 1]}" for i in range(len(tokens) - 1)]


def extract_themes(
    results: list[dict[str, Any]],
    *,
    query: str = "",
    limit: int = 12,
    min_count: int = 2,
) -> list[dict[str, Any]]:
    """Extract meaningful themes with sentiment breakdown."""
    if not results:
        return []

    q_terms = _query_terms(query)
    phrase_counter: Counter[str] = Counter()
    phrase_items: dict[str, list[dict]] = defaultdict(list)

    for row in results:
        raw = f"{row.get('title') or ''} {row.get('content') or ''}"
        text = _normalize_text(raw)
        tokens = [t for t in _tokens(text) if t not in NOISE_TERMS and t not in q_terms]
        candidates = _bigrams(tokens) + tokens
        seen_in_row: set[str] = set()
        for phrase in candidates:
            if len(phrase) < 4 or phrase in NOISE_TERMS:
                continue
            if phrase in q_terms or all(part in q_terms for part in phrase.split()):
                continue
            if phrase in seen_in_row:
                continue
            seen_in_row.add(phrase)
            phrase_counter[phrase] += 1
            phrase_items[phrase].append(row)

    themes: list[dict[str, Any]] = []
    for phrase, count in phrase_counter.most_common(limit * 3):
        if count < min_count:
            continue
        items = phrase_items[phrase]
        pos = sum(1 for i in items if i.get("sentiment") == "positive")
        neg = sum(1 for i in items if i.get("sentiment") == "negative")
        neu = len(items) - pos - neg
        total = len(items) or 1
        themes.append(
            {
                "name": phrase.title() if " " not in phrase else phrase.title(),
                "label": phrase.title() if " " not in phrase else phrase.title(),
                "count": count,
                "mentions": len(items),
                "sentiment": {
                    "positive": round(pos / total * 100, 1),
                    "neutral": round(neu / total * 100, 1),
                    "negative": round(neg / total * 100, 1),
                },
                "dominant_sentiment": max(
                    ("positive", pos), ("neutral", neu), ("negative", neg), key=lambda x: x[1]
                )[0],
            }
        )
        if len(themes) >= limit:
            break
    return themes
