"""Resolve watch keywords to crypto / stock symbols and fetch price history."""

from __future__ import annotations

import logging
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
}

HEADERS = {
    "User-Agent": "OpinionPulse/1.0 (market-data; +https://opinionpulse.app)",
    "Accept": "application/json",
}


def _normalize_query(query: str) -> str:
    return query.strip().lower().replace("$", "").replace("#", "")


def resolve_market_asset(query: str) -> dict[str, Any]:
    """Map a brand-watch keyword to crypto id or stock ticker."""
    key = _normalize_query(query)
    if not key:
        return {"asset_type": "unknown", "symbol": None, "name": query}

    if key in CRYPTO_IDS:
        coin_id = CRYPTO_IDS[key]
        return {
            "asset_type": "crypto",
            "symbol": coin_id.upper()[:6],
            "coingecko_id": coin_id,
            "name": query.strip(),
        }

    if key in STOCK_TICKERS:
        ticker = STOCK_TICKERS[key]
        return {
            "asset_type": "stock",
            "symbol": ticker,
            "name": query.strip(),
        }

    # Partial match — e.g. "Bitcoin price" -> bitcoin
    for token, coin_id in CRYPTO_IDS.items():
        if len(token) >= 3 and token in key:
            return {
                "asset_type": "crypto",
                "symbol": coin_id.upper()[:6],
                "coingecko_id": coin_id,
                "name": query.strip(),
            }

    for token, ticker in STOCK_TICKERS.items():
        if len(token) >= 3 and token in key:
            return {
                "asset_type": "stock",
                "symbol": ticker,
                "name": query.strip(),
            }

    return {"asset_type": "unknown", "symbol": None, "name": query.strip()}


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


def get_price_chart(query: str) -> dict[str, Any]:
    """Return 7-day (crypto) or 5-day (stock) price series for a watch keyword."""
    asset = resolve_market_asset(query)
    asset_type: AssetType = asset["asset_type"]

    if asset_type == "unknown":
        return {
            "query": query,
            "asset_type": "unknown",
            "symbol": None,
            "name": asset["name"],
            "current_price": None,
            "change_pct": None,
            "currency": "USD",
            "points": [],
            "message": (
                "No market ticker matched this keyword. Try names like Bitcoin, Ethereum, "
                "Apple, Tesla, or NVDA."
            ),
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
            "name": asset["name"],
            **chart,
            "message": None,
        }

    try:
        return cached(cache_key, fetch, ttl_seconds=300)
    except Exception as exc:
        logger.error("Market chart fetch failed for %r: %s", query, exc)
        return {
            "query": query,
            "asset_type": asset_type,
            "symbol": asset.get("symbol"),
            "name": asset["name"],
            "current_price": None,
            "change_pct": None,
            "currency": "USD",
            "points": [],
            "message": "Market data temporarily unavailable. Try again in a few minutes.",
        }
