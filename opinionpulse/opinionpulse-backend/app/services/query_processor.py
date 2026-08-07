"""Transform raw user queries into platform-optimized search strings."""

from __future__ import annotations

import re
from typing import Optional


class QueryProcessor:
    """
    Takes a raw user query and transforms it into
    optimized, platform-specific search queries.
    """

    DISAMBIGUATION_MAP = {
        "apple": {"company": "Apple Inc", "ticker": "AAPL", "ceo": "Tim Cook"},
        "meta": {"company": "Meta Platforms", "ticker": "META", "products": "Facebook Instagram"},
        "amazon": {"company": "Amazon.com", "ticker": "AMZN", "ceo": "Andy Jassy"},
        "google": {"company": "Alphabet Google", "ticker": "GOOGL"},
        "tesla": {"company": "Tesla Inc", "ticker": "TSLA", "ceo": "Elon Musk"},
        "twitter": {"alt": "X platform Elon Musk"},
        "python": {"context": "programming language coding"},
        "rust": {"context": "programming language systems"},
        "java": {"context": "programming language JVM"},
        "react": {"context": "React JavaScript framework web development"},
        "angular": {"context": "Angular JavaScript framework Google"},
        "vue": {"context": "Vue.js JavaScript framework frontend"},
        "svelte": {"context": "Svelte JavaScript framework frontend"},
        "nextjs": {"context": "Next.js React framework Vercel"},
        "django": {"context": "Django Python web framework"},
        "flask": {"context": "Flask Python web framework"},
        "bitcoin": {"ticker": "BTC", "alt": "cryptocurrency crypto"},
        "ethereum": {"ticker": "ETH", "alt": "cryptocurrency crypto"},
    }

    TECH_TERMS = frozenset(
        {
            "react",
            "angular",
            "vue",
            "svelte",
            "nextjs",
            "next.js",
            "django",
            "flask",
            "python",
            "rust",
            "java",
            "javascript",
            "typescript",
            "nodejs",
            "node.js",
            "golang",
            "kubernetes",
            "docker",
        }
    )

    STOP_WORDS = {
        "the",
        "a",
        "an",
        "is",
        "are",
        "was",
        "were",
        "what",
        "how",
        "why",
        "when",
        "where",
        "who",
        "about",
        "think",
        "feel",
        "opinion",
        "people",
        "anyone",
        "someone",
        "everyone",
        "something",
    }

    def process(self, raw_query: str, context: Optional[str] = None) -> dict:
        del context
        cleaned = self._clean(raw_query)
        intent = self._detect_intent(cleaned)
        expansions = self._expand(cleaned)
        disambiguation = self._disambiguate(cleaned)

        return {
            "original": raw_query,
            "cleaned": cleaned,
            "intent": intent,
            "expansions": expansions,
            "disambiguation": disambiguation,
            "platform_queries": {
                "reddit": self._reddit_query(cleaned, intent, disambiguation),
                "youtube": self._youtube_query(cleaned, intent),
                "hackernews": self._hn_query(cleaned, intent),
                "devto": self._devto_query(cleaned, intent),
                "github": self._github_query(cleaned, intent),
                "bluesky": self._bluesky_query(cleaned, expansions),
                "mastodon": self._mastodon_query(cleaned, expansions),
                "newsapi": self._news_query(cleaned, disambiguation),
                "guardian": self._news_query(cleaned, disambiguation),
                "gnews": self._news_query(cleaned, disambiguation),
                "currents": self._news_query(cleaned, disambiguation),
                "mediastack": self._news_query(cleaned, disambiguation),
                "stackoverflow": self._so_query(cleaned, intent),
            },
        }

    def _clean(self, query: str) -> str:
        q = query.strip()
        q = re.sub(
            r"^(what|how|why|when|where|who|is|are|does|do)\s+",
            "",
            q,
            flags=re.IGNORECASE,
        )
        q = re.sub(
            r"^(people think about|opinion on|sentiment about|views on)\s+",
            "",
            q,
            flags=re.IGNORECASE,
        )
        return q.strip()

    def _detect_intent(self, query: str) -> str:
        q = query.lower().strip()
        if q in self.TECH_TERMS:
            return "technical"

        if any(w in q for w in ["vs", "versus", "compare", "better", "best"]):
            return "comparison"
        if any(w in q for w in ["how to", "tutorial", "guide", "learn", "install"]):
            return "technical"
        if any(w in q for w in ["price", "stock", "market", "invest", "crypto", "btc", "eth"]):
            return "financial"
        if any(w in q for w in ["news", "latest", "recent", "update", "today"]):
            return "news"
        if any(w in q for w in ["bug", "error", "issue", "problem", "fix", "crash"]):
            return "technical_issue"
        if any(w in q for w in ["scandal", "controversy", "crisis", "hack", "breach"]):
            return "crisis"

        return "general"

    def _expand(self, query: str) -> list[str]:
        q = query.lower()
        expansions: list[str] = []

        for term, context in self.DISAMBIGUATION_MAP.items():
            if term in q:
                for val in context.values():
                    if val and val not in expansions:
                        expansions.append(val)

        return expansions[:5]

    def _disambiguate(self, query: str) -> Optional[str]:
        q = query.lower()
        for term, context in self.DISAMBIGUATION_MAP.items():
            if q == term or q.startswith(term + " "):
                return context.get("company") or context.get("context") or None
        return None

    def _reddit_query(self, query: str, intent: str, disambiguation: Optional[str]) -> str:
        base = disambiguation or query

        subreddit_hints = {
            "financial": "investing OR stocks OR crypto",
            "technical": "programming OR webdev OR javascript",
            "technical_issue": "techsupport OR programming",
            "comparison": "programming OR webdev OR javascript",
            "crisis": "news OR technology OR worldnews",
            "general": "",
        }

        hint = subreddit_hints.get(intent, "")
        if hint:
            return f"{base} {hint}"
        return base

    def _youtube_query(self, query: str, intent: str) -> str:
        context_map = {
            "financial": f"{query} analysis review",
            "technical": f"{query} tutorial explained",
            "comparison": f"{query} comparison review",
            "crisis": f"{query} news explained",
            "general": f"{query} review opinion",
        }
        return context_map.get(intent, query)

    def _hn_query(self, query: str, intent: str) -> str:
        if intent in ["financial"]:
            return f"{query} analysis"
        return query

    def _devto_query(self, query: str, intent: str) -> str:
        if intent in ["technical", "comparison"]:
            return query
        return f"{query} developer"

    def _github_query(self, query: str, intent: str) -> str:
        if intent == "technical_issue":
            return f"{query} bug error"
        if intent == "comparison":
            return f"{query} vs"
        return query

    def _bluesky_query(self, query: str, expansions: list) -> str:
        tag = query.replace(" ", "").lower()
        if expansions:
            return f"{query} #{tag}"
        return query

    def _mastodon_query(self, query: str, expansions: list) -> str:
        tag = query.replace(" ", "").lower()
        return f"{query} #{tag}"

    def _news_query(self, query: str, disambiguation: Optional[str]) -> str:
        if disambiguation:
            return f'"{query}" OR "{disambiguation}"'
        return query

    def _so_query(self, query: str, intent: str) -> str:
        if intent in ("technical", "comparison", "technical_issue"):
            return f"{query} javascript"
        if intent in ["financial", "news", "crisis"]:
            return query
        return query
