"""Relevance scoring, URL normalization, and result quality filters."""

from __future__ import annotations

import re
from typing import Any
from urllib.parse import parse_qs, urlparse, urlunparse

from app.services.url_validation import is_live_result, is_valid_url

RELEVANCE_THRESHOLD = 4

NEWS_PLATFORMS = frozenset(
    {"news", "guardian", "newsapi", "gnews", "currents", "mediastack"}
)

_URL_RE = re.compile(r"https?://\S+|www\.\S+", re.IGNORECASE)
_HASHTAG_RE = re.compile(r"#\w+", re.UNICODE)

# Hashtag-stuffed / NSFW spam often pollutes social search (e.g. #bitcoin buried in tag lists).
_SPAM_SIGNAL_WORDS = frozenset(
    {
        "nsfw",
        "nude",
        "nudes",
        "porn",
        "xxx",
        "onlyfans",
        "sexy",
        "horny",
        "slut",
        "escort",
        "camgirl",
        "adult",
        "hentai",
        "boobs",
        "tits",
        "fuck",
        "followme",
        "followback",
        "like4like",
        "freebie",
        "giveaway",
    }
)


def query_terms(query: str) -> list[str]:
    return [t for t in query.lower().split() if len(t) > 2]


def _term_variants(term: str) -> list[str]:
    """Return term plus common singular/plural variants."""
    t = term.lower().strip()
    if not t:
        return []
    variants = {t}
    if t.endswith("ies") and len(t) > 4:
        variants.add(t[:-3] + "y")
    elif t.endswith("es") and len(t) > 3:
        variants.add(t[:-2])
        variants.add(t[:-1])
    elif t.endswith("s") and len(t) > 3 and not t.endswith("ss"):
        variants.add(t[:-1])
    elif not t.endswith("s"):
        variants.add(f"{t}s")
        if t.endswith("y") and len(t) > 2:
            variants.add(f"{t[:-1]}ies")
    return list(variants)


def _term_in_text(term: str, text: str) -> bool:
    """Match whole words for short terms; handle singular/plural variants."""
    if not term or not text:
        return False
    for variant in _term_variants(term):
        if len(variant) <= 4:
            if re.search(rf"\b{re.escape(variant)}\b", text, re.IGNORECASE):
                return True
        elif variant.lower() in text.lower():
            return True
    return False


def query_term_coverage(query: str, text: str) -> float:
    terms = query_terms(query)
    if not terms:
        q = query.strip().lower()
        return 1.0 if q and q in (text or "").lower() else 0.0
    if not text:
        return 0.0
    matched = sum(1 for term in terms if _term_in_text(term, text))
    return matched / len(terms)


def is_news_result(result: dict[str, Any]) -> bool:
    platform = (result.get("platform") or "").lower()
    return platform in NEWS_PLATFORMS


def matches_search_query(query: str, result: dict[str, Any]) -> bool:
    """Return True only when the result is genuinely about the user's search topic."""
    q = query.strip()
    if not q:
        return True

    raw_title = result.get("title") or ""
    raw_content = result.get("content") or ""
    if query_in_hashtags_only(q, f"{raw_title} {raw_content}"):
        return False

    title = prose_text(raw_title)
    content = prose_text(raw_content)
    combined = f"{title} {content}".strip()
    if not combined:
        return False

    q_lower = q.lower()
    title_lower = title.lower()
    combined_lower = combined.lower()

    # Exact phrase in headline is strong signal for news and social.
    if q_lower in title_lower:
        return True

    terms = query_terms(q)
    if not terms:
        return q_lower in combined_lower

    # Multi-word phrase in body (not just one word of the phrase).
    if len(terms) > 1 and q_lower in combined_lower:
        return True

    title_cov = query_term_coverage(q, title_lower)
    combined_cov = query_term_coverage(q, combined_lower)

    if is_news_result(result):
        # News must mention every significant query term; prefer headline match.
        if combined_cov < 1.0:
            return False
        if len(terms) == 1:
            return _term_in_text(terms[0], combined_lower)
        return title_cov >= 0.5 or q_lower in title_lower

    # Social / forums / video: all terms required for multi-word queries.
    if len(terms) > 1:
        if combined_cov < 1.0:
            return False
        return title_cov >= 0.34 or q_lower in combined_lower

    # Single-term queries: whole word in title/body, or in URL for social posts.
    if _term_in_text(terms[0], combined_lower):
        return True
    if not is_news_result(result):
        url = (result.get("source_url") or result.get("url") or "").lower()
        if url and _term_in_text(terms[0], url):
            return True
    return False


def strip_urls(text: str) -> str:
    return _URL_RE.sub(" ", text or "")


def strip_hashtags(text: str) -> str:
    return _HASHTAG_RE.sub(" ", text or "")


def prose_text(text: str) -> str:
    """Body text without URLs/hashtags — used for relevance and spam checks."""
    cleaned = strip_hashtags(strip_urls(text or ""))
    return re.sub(r"\s+", " ", cleaned).strip()


def hashtag_count(text: str) -> int:
    return len(_HASHTAG_RE.findall(text or ""))


def query_in_hashtags_only(query: str, text: str) -> bool:
    """True when the query matches hashtags but not the remaining prose."""
    q = query.strip().lower()
    if not q or not text:
        return False
    terms = query_terms(query) or [q]
    prose = prose_text(text).lower()
    if any(term in prose for term in terms) or q in prose:
        return False
    lower = (text or "").lower()
    return any(f"#{term}" in lower or f"#{q.replace(' ', '')}" in lower for term in terms)


def is_spam_or_low_quality(result: dict[str, Any]) -> bool:
    """Drop hashtag-stuffed, NSFW, or engagement-bait social spam."""
    content = (result.get("content") or result.get("title") or "").strip()
    if not content:
        return True

    lower = content.lower()
    if any(word in lower for word in _SPAM_SIGNAL_WORDS):
        return True

    tags = hashtag_count(content)
    prose = prose_text(content)
    prose_words = len(re.findall(r"\b\w+\b", prose))

    # Mostly hashtags, almost no real sentence (common Bluesky/Mastodon spam pattern).
    if tags >= 8:
        return True
    if tags >= 4 and prose_words < 8:
        return True
    if tags >= 3 and prose_words > 0 and tags / prose_words > 0.45:
        return True

    # Very short posts that are only a link + one hashtag.
    if prose_words < 4 and tags >= 2:
        return True

    return False


def relevance_score(query: str, result: dict[str, Any]) -> int:
    """Score how well a result matches the user query (higher = more relevant)."""
    if not query.strip():
        return 0

    q_lower = query.strip().lower()
    raw_title = result.get("title") or ""
    raw_content = result.get("content") or ""
    title = prose_text(raw_title).lower()
    content = prose_text(raw_content).lower()
    combined = f"{title} {content}".strip()

    if not combined:
        return 0

    if query_in_hashtags_only(query, f"{raw_title} {raw_content}"):
        return 0

    if not matches_search_query(query, result):
        return 0

    score = 0
    terms = query_terms(query)

    if q_lower in title:
        score += 5
    elif q_lower in combined:
        score += 3

    for term in terms:
        if _term_in_text(term, title):
            score += 3
        elif _term_in_text(term, content):
            score += 2

    if not terms and q_lower in combined:
        score += 2

    # Require at least some substantive text mentioning the topic.
    if prose_words := len(re.findall(r"\b\w+\b", combined)):
        if prose_words < 5 and score < 5:
            score -= 1
    else:
        return 0

    return max(score, 0)


def filter_spam_results(results: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [row for row in results if not is_spam_or_low_quality(row)]


def filter_by_relevance(
    results: list[dict[str, Any]],
    query: str,
    *,
    min_score: int | None = None,
) -> list[dict[str, Any]]:
    if not results or not query.strip():
        return results
    threshold = min_score if min_score is not None else RELEVANCE_THRESHOLD
    scored: list[dict[str, Any]] = []
    for row in results:
        if is_spam_or_low_quality(row):
            continue
        if not matches_search_query(query, row):
            continue
        item = dict(row)
        rs = relevance_score(query, item)
        item["relevance_score"] = rs
        if rs >= threshold:
            scored.append(item)
    scored.sort(
        key=lambda r: (
            r.get("relevance_score", 0),
            engagement_total(r),
        ),
        reverse=True,
    )
    return scored


def normalize_url(url: str) -> str:
    """Normalize URL for deduplication (strip tracking params, trailing slash)."""
    if not url:
        return ""
    try:
        parsed = urlparse(url.strip())
        if not parsed.scheme.startswith("http"):
            return url.lower().rstrip("/")
        drop_params = {
            "utm_source",
            "utm_medium",
            "utm_campaign",
            "utm_term",
            "utm_content",
            "ref",
            "fbclid",
            "gclid",
        }
        qs = parse_qs(parsed.query, keep_blank_values=False)
        clean_qs = {k: v for k, v in qs.items() if k.lower() not in drop_params}
        new_query = "&".join(
            f"{k}={v[0]}" for k, v in sorted(clean_qs.items()) if v
        )
        path = (parsed.path or "").rstrip("/") or "/"
        return urlunparse(
            (parsed.scheme.lower(), (parsed.hostname or "").lower(), path, "", new_query, "")
        )
    except Exception:
        return url.lower().rstrip("/")


def engagement_total(result: dict[str, Any]) -> int:
    eng = result.get("engagement") or {}
    return (
        int(eng.get("likes") or 0)
        + int(eng.get("comments") or 0)
        + int(eng.get("shares") or 0)
        + int(eng.get("views") or 0) // 100
    )


def has_engagement_data(result: dict[str, Any]) -> bool:
    if result.get("engagement_available") is False:
        return False
    eng = result.get("engagement") or {}
    return any(int(eng.get(k) or 0) > 0 for k in ("likes", "comments", "shares", "views"))


def validate_live_results(
    results: list[dict[str, Any]], query: str
) -> list[dict[str, Any]]:
    """Keep rows with valid URLs that look like real posts/articles."""
    validated: list[dict[str, Any]] = []
    for row in results:
        item = dict(row)
        url = item.get("source_url") or item.get("url") or ""
        if not is_valid_url(url):
            continue
        item["source_url"] = url
        item["url"] = url
        item["is_demo"] = not is_live_result(item)
        if item["is_demo"]:
            continue
        validated.append(item)
    return validated
