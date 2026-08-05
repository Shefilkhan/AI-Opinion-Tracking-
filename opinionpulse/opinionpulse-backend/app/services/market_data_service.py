"""Resolve watch keywords to crypto / stock symbols and fetch price history."""

from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from typing import Any, Literal, Optional

import requests

from app.services.cache_utils import cached

logger = logging.getLogger(__name__)

AssetType = Literal["crypto", "stock", "unknown"]

CRYPTO_IDS: dict[str, str] = {
    "bitcoin": "bitcoin",
    "btc": "bitcoin",
    "ethereum": "ethereum",
    "eth": "ethereum",
    "solana": "solana",
    "sol": "solana",
    "dogecoin": "dogecoin",
    "doge": "dogecoin",
    "ripple": "ripple",
    "xrp": "ripple",
    "cardano": "cardano",
    "ada": "cardano",
    "polygon": "matic-network",
    "matic": "matic-network",
    "litecoin": "litecoin",
    "ltc": "litecoin",
    "chainlink": "chainlink",
    "link": "chainlink",
    "avalanche": "avalanche-2",
    "avax": "avalanche-2",
    "polkadot": "polkadot",
    "dot": "polkadot",
    "bnb": "binancecoin",
    "binance": "binancecoin",
    "crypto": "bitcoin",
    "cryptocurrency": "bitcoin",
}

STOCK_TICKERS: dict[str, str] = {
    "apple": "AAPL",
    "aapl": "AAPL",
    "microsoft": "MSFT",
    "msft": "MSFT",
    "google": "GOOGL",
    "alphabet": "GOOGL",
    "googl": "GOOGL",
    "amazon": "AMZN",
    "amzn": "AMZN",
    "tesla": "TSLA",
    "tsla": "TSLA",
    "nvidia": "NVDA",
    "nvda": "NVDA",
    "meta": "META",
    "facebook": "META",
    "netflix": "NFLX",
    "nflx": "NFLX",
    "amd": "AMD",
    "intel": "INTC",
    "intc": "INTC",
    "coinbase": "COIN",
    "coin": "COIN",
    "microstrategy": "MSTR",
    "mstr": "MSTR",
    "palantir": "PLTR",
    "pltr": "PLTR",
    "disney": "DIS",
    "dis": "DIS",
    "jpmorgan": "JPM",
    "jpm": "JPM",
    "visa": "V",
    "mastercard": "MA",
    "salesforce": "CRM",
    "crm": "CRM",
    "uber": "UBER",
    "airbnb": "ABNB",
    "spotify": "SPOT",
    "shopify": "SHOP",
    "openai": "MSFT",
    "walmart": "WMT",
    "wmt": "WMT",
    "costco": "COST",
    "nike": "NKE",
    "nke": "NKE",
    "coca cola": "KO",
    "cocacola": "KO",
    "pepsi": "PEP",
    "pepsico": "PEP",
    "boeing": "BA",
    "ford": "F",
    "gm": "GM",
    "general motors": "GM",
    "goldman sachs": "GS",
    "bank of america": "BAC",
    "wells fargo": "WFC",
    "oracle": "ORCL",
    "orcl": "ORCL",
    "ibm": "IBM",
    "adobe": "ADBE",
    "adbe": "ADBE",
    "paypal": "PYPL",
    "pypl": "PYPL",
    "snap": "SNAP",
    "snapchat": "SNAP",
    "twitter": "X",
    "x corp": "X",
    "roblox": "RBLX",
    "snowflake": "SNOW",
    "crowdstrike": "CRWD",
    "datadog": "DDOG",
    "block": "SQ",
    "square": "SQ",
    "robinhood": "HOOD",
    "gamestop": "GME",
    "gme": "GME",
    "amc": "AMC",
    "rivian": "RIVN",
    "lucid": "LCID",
    "nio": "NIO",
    "byd": "BYDDY",
    "samsung": "SSNLF",
    "sony": "SONY",
    "toyota": "TM",
    "honda": "HMC",
}

# Private / unlisted brands mapped to a liquid public proxy (investor or sector peer).
PUBLIC_PROXIES: dict[str, dict[str, str]] = {
    "openai": {
        "symbol": "MSFT",
        "name": "Microsoft (OpenAI partner)",
        "note": "OpenAI is private; showing Microsoft as a related public stock.",
    },
    "chatgpt": {
        "symbol": "MSFT",
        "name": "Microsoft (OpenAI partner)",
        "note": "OpenAI is private; showing Microsoft as a related public stock.",
    },
    "anthropic": {
        "symbol": "GOOGL",
        "name": "Alphabet (Anthropic investor)",
        "note": "Anthropic is private; showing Alphabet as a related public stock.",
    },
    "claude": {
        "symbol": "GOOGL",
        "name": "Alphabet (Anthropic investor)",
        "note": "Anthropic is private; showing Alphabet as a related public stock.",
    },
    "spacex": {
        "symbol": "TSLA",
        "name": "Tesla (Elon Musk)",
        "note": "SpaceX is private; showing Tesla as a related public stock.",
    },
    "stripe": {
        "symbol": "SQ",
        "name": "Block (payments peer)",
        "note": "Stripe is private; showing Block as a payments-sector proxy.",
    },
}

HEADERS = {
    "User-Agent": "OpinionPulse/1.0 (market-data; +https://opinionpulse.app)",
    "Accept": "application/json",
}

_TICKER_RE = re.compile(r"^[A-Z]{1,5}(\.[A-Z]{1,2})?$")


def _normalize_query(query: str) -> str:
    return query.strip().lower().replace("$", "").replace("#", "")


def _looks_like_ticker(raw: str) -> bool:
    token = raw.strip().upper().replace("$", "")
    return bool(_TICKER_RE.match(token))


def _search_coingecko_id(query: str) -> Optional[str]:
    cache_key = f"cg_search_{_normalize_query(query)}"

    def fetch() -> Optional[str]:
        try:
            resp = requests.get(
                "https://api.coingecko.com/api/v3/search",
                params={"query": query.strip()},
                headers=HEADERS,
                timeout=10,
            )
            if not resp.ok:
                return None
            coins = resp.json().get("coins") or []
            if not coins:
                return None
            return str(coins[0]["id"])
        except Exception as exc:
            logger.debug("CoinGecko search failed for %r: %s", query, exc)
            return None

    return cached(cache_key, fetch, ttl_seconds=86400)


def _search_yahoo_ticker(query: str) -> Optional[str]:
    cache_key = f"yahoo_search_{_normalize_query(query)}"

    def fetch() -> Optional[str]:
        try:
            resp = requests.get(
                "https://query2.finance.yahoo.com/v1/finance/search",
                params={
                    "q": query.strip(),
                    "quotesCount": 8,
                    "newsCount": 0,
                    "listsCount": 0,
                },
                headers=HEADERS,
                timeout=10,
            )
            if not resp.ok:
                return None
            quotes = resp.json().get("quotes") or []
            for quote in quotes:
                quote_type = (quote.get("quoteType") or "").upper()
                symbol = quote.get("symbol")
                if not symbol or quote_type not in ("EQUITY", "ETF"):
                    continue
                return str(symbol)
            return None
        except Exception as exc:
            logger.debug("Yahoo search failed for %r: %s", query, exc)
            return None

    return cached(cache_key, fetch, ttl_seconds=86400)


def resolve_market_asset(query: str) -> dict[str, Any]:
    """Map a brand-watch keyword to crypto id or stock ticker."""
    raw = query.strip()
    key = _normalize_query(raw)
    if not key:
        return {"asset_type": "unknown", "symbol": None, "name": query, "proxy_note": None}

    if key in PUBLIC_PROXIES:
        proxy = PUBLIC_PROXIES[key]
        return {
            "asset_type": "stock",
            "symbol": proxy["symbol"],
            "name": proxy["name"],
            "proxy_note": proxy.get("note"),
        }

    if _looks_like_ticker(raw):
        return {
            "asset_type": "stock",
            "symbol": raw.upper().replace("$", ""),
            "name": raw.upper(),
            "proxy_note": None,
        }

    if key in CRYPTO_IDS:
        coin_id = CRYPTO_IDS[key]
        return {
            "asset_type": "crypto",
            "symbol": coin_id.upper()[:6],
            "coingecko_id": coin_id,
            "name": raw,
            "proxy_note": None,
        }

    if key in STOCK_TICKERS:
        ticker = STOCK_TICKERS[key]
        return {
            "asset_type": "stock",
            "symbol": ticker,
            "name": raw,
            "proxy_note": None,
        }

    for token, coin_id in CRYPTO_IDS.items():
        if len(token) >= 3 and token in key:
            return {
                "asset_type": "crypto",
                "symbol": coin_id.upper()[:6],
                "coingecko_id": coin_id,
                "name": raw,
                "proxy_note": None,
            }

    for token, ticker in STOCK_TICKERS.items():
        if len(token) >= 3 and token in key:
            return {
                "asset_type": "stock",
                "symbol": ticker,
                "name": raw,
                "proxy_note": None,
            }

    coin_id = _search_coingecko_id(raw)
    if coin_id:
        return {
            "asset_type": "crypto",
            "symbol": coin_id.upper()[:6],
            "coingecko_id": coin_id,
            "name": raw,
            "proxy_note": None,
        }

    ticker = _search_yahoo_ticker(raw)
    if ticker:
        return {
            "asset_type": "stock",
            "symbol": ticker,
            "name": raw,
            "proxy_note": None,
        }

    return {
        "asset_type": "unknown",
        "symbol": None,
        "name": raw,
        "proxy_note": None,
    }


def resolve_market_asset_from_terms(terms: list[str]) -> dict[str, Any]:
    """Try several watch terms (brand, product, aliases) until one resolves."""
    seen: set[str] = set()
    for term in terms:
        cleaned = (term or "").strip()
        if not cleaned:
            continue
        norm = _normalize_query(cleaned)
        if norm in seen:
            continue
        seen.add(norm)
        asset = resolve_market_asset(cleaned)
        if asset["asset_type"] != "unknown":
            return asset
    first = next((t.strip() for t in terms if t and t.strip()), "Unknown")
    return {"asset_type": "unknown", "symbol": None, "name": first, "proxy_note": None}


def _fetch_crypto_chart(coin_id: str) -> dict[str, Any]:
    url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart"
    params = {"vs_currency": "usd", "days": "7", "interval": "daily"}
    resp = requests.get(url, params=params, headers=HEADERS, timeout=12)
    resp.raise_for_status()
    data = resp.json()

    prices = data.get("prices") or []
    points = [
        {
            "time": datetime.fromtimestamp(ts / 1000, tz=timezone.utc).strftime("%b %d"),
            "price": round(float(price), 2),
        }
        for ts, price in prices
    ]

    current = points[-1]["price"] if points else None
    change_pct = None
    if len(points) >= 2 and points[0]["price"]:
        change_pct = round(
            ((points[-1]["price"] - points[0]["price"]) / points[0]["price"]) * 100, 2
        )

    # Live price + 24h change
    simple_url = "https://api.coingecko.com/api/v3/simple/price"
    simple = requests.get(
        simple_url,
        params={
            "ids": coin_id,
            "vs_currencies": "usd",
            "include_24hr_change": "true",
        },
        headers=HEADERS,
        timeout=10,
    ).json()
    coin = simple.get(coin_id, {})
    if coin.get("usd"):
        current = float(coin["usd"])
    if coin.get("usd_24h_change") is not None:
        change_pct = round(float(coin["usd_24h_change"]), 2)

    return {
        "current_price": current,
        "change_pct": change_pct,
        "currency": "USD",
        "points": points,
    }


def _fetch_stock_chart(ticker: str) -> dict[str, Any]:
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
    params = {"range": "5d", "interval": "1h"}
    resp = requests.get(url, params=params, headers=HEADERS, timeout=12)
    resp.raise_for_status()
    payload = resp.json()
    result = (payload.get("chart") or {}).get("result") or []
    if not result:
        raise ValueError(f"No Yahoo Finance data for {ticker}")

    meta = result[0].get("meta") or {}
    timestamps = result[0].get("timestamp") or []
    closes = (result[0].get("indicators") or {}).get("quote", [{}])[0].get("close") or []

    points: list[dict[str, Any]] = []
    for ts, close in zip(timestamps, closes):
        if close is None:
            continue
        points.append(
            {
                "time": datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%b %d %H:%M"),
                "price": round(float(close), 2),
            }
        )

    # Downsample for chart readability
    if len(points) > 48:
        step = max(1, len(points) // 48)
        points = points[::step]

    current = meta.get("regularMarketPrice") or (points[-1]["price"] if points else None)
    change_pct = meta.get("regularMarketChangePercent")
    if change_pct is not None:
        change_pct = round(float(change_pct), 2)

    return {
        "current_price": round(float(current), 2) if current is not None else None,
        "change_pct": change_pct,
        "currency": meta.get("currency", "USD"),
        "points": points,
    }


def get_price_chart(query: str, *, terms: list[str] | None = None) -> dict[str, Any]:
    """Return 7-day (crypto) or 5-day (stock) price series for a watch keyword."""
    search_terms = terms if terms else [query]
    asset = resolve_market_asset_from_terms(search_terms)
    asset_type: AssetType = asset["asset_type"]
    display_name = asset.get("name") or query

    if asset_type == "unknown":
        return {
            "query": query,
            "asset_type": "unknown",
            "symbol": None,
            "name": display_name,
            "current_price": None,
            "change_pct": None,
            "currency": "USD",
            "points": [],
            "message": (
                "No market ticker matched this brand. Add a public company name, "
                "stock ticker (e.g. AAPL), or crypto name (Bitcoin, Ethereum)."
            ),
            "proxy_note": None,
        }

    cache_key = f"market_chart_{asset_type}_{asset.get('coingecko_id') or asset.get('symbol')}"

    def fetch() -> dict[str, Any]:
        if asset_type == "crypto":
            chart = _fetch_crypto_chart(asset["coingecko_id"])
        else:
            chart = _fetch_stock_chart(asset["symbol"])
        return {
            "query": query,
            "asset_type": asset_type,
            "symbol": asset.get("symbol"),
            "name": display_name,
            **chart,
            "message": asset.get("proxy_note"),
            "proxy_note": asset.get("proxy_note"),
        }

    try:
        return cached(cache_key, fetch, ttl_seconds=300)
    except Exception as exc:
        logger.error("Market chart fetch failed for %r: %s", query, exc)
        return {
            "query": query,
            "asset_type": asset_type,
            "symbol": asset.get("symbol"),
            "name": display_name,
            "current_price": None,
            "change_pct": None,
            "currency": "USD",
            "points": [],
            "message": "Market data temporarily unavailable. Try again in a few minutes.",
            "proxy_note": asset.get("proxy_note"),
        }


def get_price_charts_for_watches(watches: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Fetch live price charts for multiple brand watches."""
    charts: list[dict[str, Any]] = []
    for watch in watches:
        watch_id = watch["watch_id"]
        query = watch["query"]
        terms = watch.get("terms") or [query]
        chart = get_price_chart(query, terms=terms)
        charts.append({"watch_id": watch_id, **chart})
    return charts
