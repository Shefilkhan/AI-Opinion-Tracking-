"""Brand disambiguation and noise filtering for search results."""

from __future__ import annotations

import re
from typing import Any

NEWS_PLATFORMS = frozenset(
    {"news", "guardian", "newsapi", "gnews", "currents", "mediastack"}
)

MARKETPLACE_PATTERNS = (
    "mercari",
    "ebay",
    "poshmark",
    "depop",
    "grailed",
    "stockx",
    "goat.com",
    "vinted",
    "thredup",
    "facebook marketplace",
    "offerup",
    "letgo",
    "replica",
    "dupe",
    "counterfeit",
    "fake ",
    "for sale",
    "buy now",
    "shop now",
    "free shipping",
    "size ",
    "authenticity",
)

KNOWN_BRANDS: dict[str, dict[str, Any]] = {
    "gucci": {
        "company": "Gucci",
        "sector": "luxury fashion",
        "aliases": ["gucci group", "kering gucci"],
        "exclude_terms": ["mercari", "poshmark", "depop", "ebay", "replica", "dupe"],
    },
    "apple": {
        "company": "Apple Inc",
        "sector": "technology",
        "aliases": ["apple inc", "aapl", "iphone", "tim cook"],
        "exclude_terms": ["apple pie", "apple cider", "apple orchard", "apple recipe", "green apple fruit"],
    },
    "nike": {
        "company": "Nike Inc",
        "sector": "sportswear",
        "aliases": ["nike inc", "just do it", "air jordan"],
        "exclude_terms": ["mercari", "poshmark", "depop", "ebay", "replica", "fake nike"],
    },
    "adidas": {
        "company": "Adidas",
        "sector": "sportswear",
        "aliases": ["adidas ag"],
        "exclude_terms": ["mercari", "poshmark", "depop", "ebay", "replica"],
    },
    "louis vuitton": {
        "company": "Louis Vuitton",
        "sector": "luxury fashion",
        "aliases": ["lv", "lvmh"],
        "exclude_terms": ["mercari", "poshmark", "depop", "ebay", "replica", "dupe"],
    },
    "lv": {
        "company": "Louis Vuitton",
        "sector": "luxury fashion",
        "aliases": ["louis vuitton"],
        "exclude_terms": ["mercari", "poshmark", "depop", "ebay", "replica"],
    },
    "chanel": {
        "company": "Chanel",
        "sector": "luxury fashion",
        "aliases": ["chanel sa"],
        "exclude_terms": ["mercari", "poshmark", "depop", "ebay", "replica"],
    },
    "prada": {
        "company": "Prada",
        "sector": "luxury fashion",
        "aliases": ["prada group"],
        "exclude_terms": ["mercari", "poshmark", "depop", "ebay", "replica"],
    },
    "meta": {
        "company": "Meta Platforms",
        "sector": "technology",
        "aliases": ["facebook", "instagram", "whatsapp"],
        "exclude_terms": ["metaverse game nft scam"],
    },
    "google": {
        "company": "Alphabet Google",
        "sector": "technology",
        "aliases": ["alphabet", "googl", "android"],
        "exclude_terms": [],
    },
    "tesla": {
        "company": "Tesla Inc",
        "sector": "automotive",
        "aliases": ["tsla", "elon musk tesla"],
        "exclude_terms": ["nikola tesla inventor biography"],
    },
    "amazon": {
        "company": "Amazon.com",
        "sector": "technology",
        "aliases": ["amzn", "aws", "jeff bezos amazon"],
        "exclude_terms": ["amazon rainforest", "amazon river"],
    },
    "microsoft": {
        "company": "Microsoft",
        "sector": "technology",
        "aliases": ["msft", "windows", "azure"],
        "exclude_terms": [],
    },
    "samsung": {
        "company": "Samsung",
        "sector": "technology",
        "aliases": ["samsung electronics", "galaxy"],
        "exclude_terms": [],
    },
    "starbucks": {
        "company": "Starbucks",
        "sector": "food beverage",
        "aliases": ["sbux"],
        "exclude_terms": [],
    },
    "mcdonalds": {
        "company": "McDonald's",
        "sector": "food beverage",
        "aliases": ["mcd", "mcdonald's"],
        "exclude_terms": [],
    },
    "disney": {
        "company": "Disney",
        "sector": "entertainment",
        "aliases": ["walt disney", "disney plus"],
        "exclude_terms": [],
    },
    "netflix": {
        "company": "Netflix",
        "sector": "entertainment",
        "aliases": ["nflx"],
        "exclude_terms": [],
    },
    "spotify": {
        "company": "Spotify",
        "sector": "entertainment",
        "aliases": ["spot"],
        "exclude_terms": [],
    },
}

_ASCII_RE = re.compile(r"[a-zA-Z]")
_NON_ASCII_RE = re.compile(r"[^\x00-\x7F]")


class BrandDisambiguator:
    """Detect brand queries and filter marketplace / off-topic noise."""

    def __init__(self, brands: dict[str, dict[str, Any]] | None = None) -> None:
        self.brands = brands or KNOWN_BRANDS

    def is_brand(self, query: str) -> bool:
        key = query.strip().lower()
        if not key:
            return False
        if key in self.brands:
            return True
        return any(key.startswith(f"{brand} ") for brand in self.brands)

    def get_brand_config(self, query: str) -> dict[str, Any] | None:
        key = query.strip().lower()
        if key in self.brands:
            return self.brands[key]
        for brand, config in self.brands.items():
            if key.startswith(f"{brand} "):
                return config
        return None

    def build_precise_query(self, query: str) -> str:
        config = self.get_brand_config(query)
        if not config:
            return query.strip()
        company = config.get("company") or query.strip()
        aliases = config.get("aliases") or []
        parts = [f'"{query.strip()}"', f'"{company}"']
        parts.extend(f'"{alias}"' for alias in aliases[:3])
        return " OR ".join(parts)

    def is_spam(self, result: dict[str, Any], query: str) -> bool:
        """Flag marketplace/resale listings — less aggressive for news articles."""
        platform = (result.get("platform") or "").lower()
        if platform in NEWS_PLATFORMS:
            return False

        text = f"{result.get('title') or ''} {result.get('content') or ''}".lower()
        url = (result.get("source_url") or result.get("url") or "").lower()
        combined = f"{text} {url}"

        hits = sum(1 for pattern in MARKETPLACE_PATTERNS if pattern in combined)
        if hits >= 2:
            return True
        if hits >= 1 and any(p in combined for p in ("mercari", "poshmark", "depop", "ebay")):
            return True
        return False

    def is_english(self, text: str) -> bool:
        """Simple heuristic: mostly ASCII letters and not mostly non-English script."""
        if not text or not text.strip():
            return True
        if len(_NON_ASCII_RE.findall(text)) > len(text) * 0.35:
            return False
        letters = _ASCII_RE.findall(text)
        if not letters:
            return True
        return len(letters) >= max(3, len(text.strip()) * 0.15)

    def should_exclude_result(self, result: dict[str, Any], query: str) -> bool:
        """Exclude brand-related noise (marketplace listings, off-topic mentions)."""
        config = self.get_brand_config(query)
        if not config:
            return False

        platform = (result.get("platform") or "").lower()
        if platform in NEWS_PLATFORMS:
            return False

        text = f"{result.get('title') or ''} {result.get('content') or ''}".lower()
        exclude_terms = config.get("exclude_terms") or []
        if any(term in text for term in exclude_terms):
            return True

        brand_key = query.strip().lower().split()[0]
        company = (config.get("company") or "").lower()
        aliases = [a.lower() for a in config.get("aliases") or []]
        brand_signals = {brand_key, company, *aliases}
        if not any(signal and signal in text for signal in brand_signals if signal):
            if self.is_spam(result, query):
                return True

        return False
