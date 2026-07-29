"""Keyword extraction for search summaries and trending topics."""

from __future__ import annotations

import re
from collections import Counter
from typing import Any

STOPWORDS = frozenset(
    {
        "the",
        "a",
        "an",
        "and",
        "or",
        "but",
        "in",
        "on",
        "at",
        "to",
        "for",
        "of",
        "is",
        "are",
        "was",
        "were",
        "be",
        "been",
        "being",
        "have",
        "has",
        "had",
        "do",
        "does",
        "did",
        "will",
        "would",
        "could",
        "should",
        "may",
        "might",
        "must",
        "shall",
        "can",
        "this",
        "that",
        "these",
        "those",
        "it",
        "its",
        "they",
        "them",
        "their",
        "we",
        "our",
        "you",
        "your",
        "he",
        "she",
        "his",
        "her",
        "with",
        "from",
        "by",
        "about",
        "into",
        "through",
        "during",
        "before",
        "after",
        "above",
        "below",
        "between",
        "under",
        "over",
        "again",
        "further",
        "then",
        "once",
        "here",
        "there",
        "when",
        "where",
        "why",
        "how",
        "all",
        "each",
        "few",
        "more",
        "most",
        "other",
        "some",
        "such",
        "no",
        "nor",
        "not",
        "only",
        "own",
        "same",
        "so",
        "than",
        "too",
        "very",
        "just",
        "also",
        "now",
        "new",
        "says",
        "said",
        "like",
        "get",
        "got",
        "https",
        "http",
        "www",
        "com",
        "org",
        "net",
        "html",
        "href",
        "link",
        "click",
        "watch",
        "live",
        "signal",
        "chart",
    }
)

_URL_TOKEN_RE = re.compile(r"https?://\S+|www\.\S+", re.IGNORECASE)
_HASHTAG_TOKEN_RE = re.compile(r"#(\w+)", re.UNICODE)


def extract_keywords_from_results(
    results: list[dict[str, Any]], limit: int = 10
) -> list[dict[str, int]]:
    counter: Counter[str] = Counter()
    for row in results:
        raw = f"{row.get('title', '')} {row.get('content', '')}".lower()
        text = _URL_TOKEN_RE.sub(" ", raw)
        text = re.sub(r"#\w+", " ", text)
        words = re.findall(r"[a-z]{4,}", text)
        for w in words:
            if w not in STOPWORDS:
                counter[w] += 1
        for tag in _HASHTAG_TOKEN_RE.findall(raw):
            tag_lower = tag.lower()
            if len(tag_lower) >= 4 and tag_lower not in STOPWORDS:
                counter[tag_lower] += 1
    return [{"word": w, "count": c} for w, c in counter.most_common(limit)]


def extract_trending_topics(
    results: list[dict[str, Any]], limit: int = 10
) -> list[dict[str, str]]:
    topics: list[dict[str, str]] = []
    seen: set[str] = set()
    for row in results:
        title = (row.get("title") or row.get("content", ""))[:80].strip()
        if not title or title.lower() in seen:
            continue
        seen.add(title.lower())
        sentiment = row.get("sentiment", "neutral")
        mapped = (
            "positive"
            if sentiment == "positive"
            else "negative"
            if sentiment == "negative"
            else "mixed"
        )
        engagement = row.get("engagement") or {}
        likes = int(engagement.get("likes") or 0)
        mentions = f"{likes:,}" if likes else "Trending"
        topics.append(
            {
                "name": title[:40] + ("…" if len(title) > 40 else ""),
                "mentions": mentions,
                "sentiment": mapped,
                "trend": "up" if sentiment == "positive" else "down",
                "query": title.split(".")[0][:50],
            }
        )
        if len(topics) >= limit:
            break
    return topics
