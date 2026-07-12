"""Fetch alternative market intelligence from Quiver Quantitative."""

from __future__ import annotations

import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any, Callable, Optional

import requests

from app.core.config import get_settings
from app.services.cache_utils import cached
from app.services.market_data_service import resolve_market_asset

logger = logging.getLogger(__name__)

BASE_URL = "https://api.quiverquant.com"
MAX_RECORDS = 5
REQUEST_TIMEOUT = 12

SECTION_DEFS: list[dict[str, str]] = [
    {
        "id": "congress",
        "label": "Congressional trading",
        "emoji": "📈",
        "description": "Stock trades disclosed by U.S. Congress members",
    },
    {
        "id": "insiders",
        "label": "Insider trading",
        "emoji": "💼",
        "description": "SEC Form 4 insider buy/sell filings",
    },
    {
        "id": "gov_contracts",
        "label": "Government contracts",
        "emoji": "🏛️",
        "description": "Federal contract awards linked to this company",
    },
    {
        "id": "lobbying",
        "label": "Corporate lobbying",
        "emoji": "💰",
        "description": "Registered lobbying spend and issues",
    },
    {
        "id": "etf_holdings",
        "label": "ETF & top holders",
        "emoji": "📊",
        "description": "Largest institutional and ETF shareholders",
    },
    {
        "id": "hedge_funds",
        "label": "Hedge fund activity",
        "emoji": "🏦",
        "description": "Recent 13F institutional position changes",
    },
    {
        "id": "alt_data",
        "label": "Alternative market data",
        "emoji": "📰",
        "description": "Quiver newsfeed and off-exchange trading signals",
    },
]


def _pick(row: dict[str, Any], *keys: str) -> Any:
    lower_map = {str(k).lower(): v for k, v in row.items()}
    for key in keys:
        val = lower_map.get(key.lower())
        if val not in (None, "", "null"):
            return val
    return None


def _format_amount(value: Any) -> Optional[str]:
    if value in (None, "", "null"):
        return None
    try:
        num = float(value)
    except (TypeError, ValueError):
        return str(value)
    if abs(num) >= 1_000_000_000:
        return f"${num / 1_000_000_000:.2f}B"
    if abs(num) >= 1_000_000:
        return f"${num / 1_000_000:.2f}M"
    if abs(num) >= 1_000:
        return f"${num / 1_000:.1f}K"
    return f"${num:,.0f}"


def _format_date(value: Any) -> Optional[str]:
    if value in (None, "", "null"):
        return None
    text = str(value)
    return text[:10] if len(text) >= 10 else text


def _parse_rows(payload: Any) -> list[dict[str, Any]]:
    if payload is None:
        return []
    if isinstance(payload, list):
        return [row for row in payload if isinstance(row, dict)]
    if isinstance(payload, dict):
        for key in ("data", "ownership", "results", "items"):
            nested = payload.get(key)
            if isinstance(nested, list):
                return [row for row in nested if isinstance(row, dict)]
        return [payload]
    if isinstance(payload, str):
        lowered = payload.lower()
        if "upgrade your subscription" in lowered:
            raise PermissionError(payload.strip('"'))
    return []


def _quiver_headers(api_key: str) -> dict[str, str]:
    token = api_key.strip()
    scheme = "Bearer" if not token.lower().startswith(("bearer ", "token ")) else ""
    auth = token if not scheme else f"{scheme} {token}"
    return {"Authorization": auth, "Accept": "application/json"}


def _quiver_request(path: str, params: Optional[dict[str, Any]] = None) -> list[dict[str, Any]]:
    settings = get_settings()
    api_key = (settings.quiver_api_key or "").strip()
    if not api_key:
        raise RuntimeError("Quiver API key is not configured")

    url = f"{BASE_URL}{path}"
    resp = requests.get(
        url,
        headers=_quiver_headers(api_key),
        params=params or {},
        timeout=REQUEST_TIMEOUT,
    )
    if resp.status_code == 401:
        raise PermissionError("Invalid Quiver API key")
    if resp.status_code == 403:
        raise PermissionError(resp.text.strip('"') or "Quiver plan does not include this dataset")
    resp.raise_for_status()

    try:
        payload = resp.json()
    except ValueError as exc:
        raise ValueError("Unexpected Quiver response") from exc

    if isinstance(payload, str) and "upgrade your subscription" in payload.lower():
        raise PermissionError(payload.strip('"'))

    return _parse_rows(payload)


def _map_congress(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    records = []
    for row in rows[:MAX_RECORDS]:
        rep = _pick(row, "Representative", "Senator", "Name", "Politician")
        txn = _pick(row, "Transaction", "Type", "transaction_type")
        amount = _format_amount(_pick(row, "Amount", "Range", "Value"))
        records.append(
            {
                "title": rep or "Congress member",
                "subtitle": txn,
                "date": _format_date(_pick(row, "Traded", "TransactionDate", "Filed", "Date")),
                "amount": amount,
                "detail": _pick(row, "Description", "AssetDescription"),
                "meta": {
                    k: str(v)
                    for k, v in {
                        "Party": _pick(row, "Party"),
                        "House": _pick(row, "House", "Chamber"),
                    }.items()
                    if v
                },
            }
        )
    return records


def _map_insiders(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    records = []
    for row in rows[:MAX_RECORDS]:
        owner = _pick(row, "Name", "Owner", "Insider")
        title = _pick(row, "OfficerTitle", "Relationship", "officer_title")
        txn = _pick(row, "Transaction", "TransactionCode", "transaction_type")
        shares = _pick(row, "Shares", "shares")
        records.append(
            {
                "title": owner or "Insider",
                "subtitle": title or txn,
                "date": _format_date(_pick(row, "Date", "fileDate", "FilingDate")),
                "detail": f"{txn} · {shares} shares" if txn and shares else txn or shares,
                "amount": _format_amount(_pick(row, "Value", "Price")),
                "meta": {},
            }
        )
    return records


def _map_gov_contracts(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    records = []
    for row in rows[:MAX_RECORDS]:
        agency = _pick(row, "Agency", "Department", "agency")
        desc = _pick(row, "Description", "AwardDescription", "description")
        records.append(
            {
                "title": agency or "Federal agency",
                "subtitle": desc,
                "date": _format_date(_pick(row, "action_date", "Date", "AwardDate")),
                "amount": _format_amount(_pick(row, "Amount", "award_amount", "AwardAmount")),
                "detail": _pick(row, "Recipient", "recipient_name"),
                "meta": {},
            }
        )
    return records


def _map_lobbying(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    records = []
    for row in rows[:MAX_RECORDS]:
        issue = _pick(row, "Issue", "Specific_Issue", "issue")
        client = _pick(row, "Client", "Registrant", "client")
        records.append(
            {
                "title": client or "Lobbying activity",
                "subtitle": issue,
                "date": _format_date(_pick(row, "Date", "Year")),
                "amount": _format_amount(_pick(row, "Amount", "Income", "amount")),
                "detail": _pick(row, "Description", "description"),
                "meta": {},
            }
        )
    return records


def _map_shareholders(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    records = []
    for row in rows[:MAX_RECORDS]:
        holder = _pick(row, "Name", "Holder", "Institution", "owner")
        shares = _pick(row, "Shares", "shares", "ShareCount")
        pct = _pick(row, "Percent", "pct", "PercentOfShares")
        records.append(
            {
                "title": holder or "Shareholder",
                "subtitle": f"{pct}% ownership" if pct else None,
                "date": None,
                "detail": f"{shares} shares" if shares else None,
                "amount": None,
                "meta": {
                    k: str(v)
                    for k, v in {"Type": _pick(row, "Type", "HolderType")}.items()
                    if v
                },
            }
        )
    return records


def _map_hedge_funds(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    records = []
    for row in rows[:MAX_RECORDS]:
        owner = _pick(row, "Owner", "Fund", "Institution", "filer")
        change = _pick(row, "Change", "ChangeType", "change_type")
        shares = _pick(row, "Shares", "shares", "CurrentShares")
        records.append(
            {
                "title": owner or "Institutional holder",
                "subtitle": change,
                "date": _format_date(_pick(row, "Date", "ReportPeriod")),
                "detail": f"{shares} shares" if shares else None,
                "amount": _format_amount(_pick(row, "Value", "MarketValue")),
                "meta": {},
            }
        )
    return records


def _map_alt_data(news_rows: list[dict[str, Any]], off_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    records = []
    for row in news_rows[:3]:
        records.append(
            {
                "title": _pick(row, "title", "Title") or "Market headline",
                "subtitle": _pick(row, "category", "Category"),
                "date": _format_date(_pick(row, "time", "Time", "Date")),
                "detail": (_pick(row, "summary", "Summary") or "")[:220] or None,
                "amount": None,
                "meta": {},
            }
        )
    for row in off_rows[:2]:
        records.append(
            {
                "title": "Off-exchange activity",
                "subtitle": _pick(row, "Ticker", "ticker"),
                "date": _format_date(_pick(row, "Date", "date")),
                "detail": f"Short volume ratio {_pick(row, 'ShortVolumeRatio', 'short_volume_ratio')}",
                "amount": _format_amount(_pick(row, "TotalVolume", "total_volume")),
                "meta": {},
            }
        )
    return records[:MAX_RECORDS]


def _fetch_section(
    section_id: str,
    ticker: str,
) -> tuple[str, list[dict[str, Any]], Optional[str]]:
    fetchers: dict[str, Callable[[], list[dict[str, Any]]]] = {
        "congress": lambda: _quiver_request(f"/beta/historical/congresstrading/{ticker}"),
        "insiders": lambda: _quiver_request("/beta/live/insiders", {"ticker": ticker}),
        "gov_contracts": lambda: _quiver_request(f"/beta/historical/govcontractsall/{ticker}"),
        "lobbying": lambda: _quiver_request(f"/beta/historical/lobbying/{ticker}"),
        "etf_holdings": lambda: _quiver_request(f"/beta/live/topshareholders/{ticker}"),
        "hedge_funds": lambda: _quiver_request("/beta/live/sec13fchanges", {"ticker": ticker}),
        "alt_data": lambda: _quiver_request("/beta/live/quivernews", {"ticker": ticker, "page_size": 5}),
    }
    mappers: dict[str, Callable[[list[dict[str, Any]]], list[dict[str, Any]]]] = {
        "congress": _map_congress,
        "insiders": _map_insiders,
        "gov_contracts": _map_gov_contracts,
        "lobbying": _map_lobbying,
        "etf_holdings": _map_shareholders,
        "hedge_funds": _map_hedge_funds,
    }

    try:
        if section_id == "alt_data":
            news_rows = fetchers["alt_data"]()
            try:
                off_rows = _quiver_request(f"/beta/historical/offexchange/{ticker}")
            except Exception:
                off_rows = []
            records = _map_alt_data(news_rows, off_rows)
            return section_id, records, None

        rows = fetchers[section_id]()
        records = mappers[section_id](rows)
        return section_id, records, None
    except PermissionError as exc:
        return section_id, [], str(exc)
    except Exception as exc:
        logger.warning("Quiver section %s failed for %s: %s", section_id, ticker, exc)
        return section_id, [], "Data temporarily unavailable"


def get_quiver_intelligence(query: str) -> dict[str, Any]:
    """Return Quiver alternative-data sections for a watch keyword."""
    settings = get_settings()
    asset = resolve_market_asset(query)
    asset_type = asset["asset_type"]
    ticker = asset.get("symbol")

    base_response: dict[str, Any] = {
        "query": query,
        "ticker": ticker,
        "configured": bool((settings.quiver_api_key or "").strip()),
        "asset_type": asset_type,
        "source": "Quiver Quantitative",
        "sections": [],
        "message": None,
    }

    if not base_response["configured"]:
        base_response["message"] = (
            "Add QUIVER_API_KEY in backend .env.local to enable Quiver Quant datasets "
            "(congressional trades, insiders, lobbying, 13F, and more)."
        )
        base_response["sections"] = [
            {
                **section,
                "available": False,
                "message": "API key not configured",
                "records": [],
            }
            for section in SECTION_DEFS
        ]
        return base_response

    if asset_type == "crypto":
        base_response["message"] = (
            "Quiver Quant focuses on U.S. public equities. Crypto watches do not map to a stock ticker."
        )
        base_response["sections"] = [
            {
                **section,
                "available": False,
                "message": "Not available for crypto keywords",
                "records": [],
            }
            for section in SECTION_DEFS
        ]
        return base_response

    if asset_type == "unknown" or not ticker:
        base_response["message"] = (
            "No public stock ticker matched this keyword. Quiver data works for listed companies "
            "(e.g. Apple, Tesla, NVDA)."
        )
        base_response["sections"] = [
            {
                **section,
                "available": False,
                "message": "No ticker match",
                "records": [],
            }
            for section in SECTION_DEFS
        ]
        return base_response

    cache_key = f"quiver_intel_{ticker.upper()}"

    def fetch() -> dict[str, Any]:
        section_results: dict[str, tuple[list[dict[str, Any]], Optional[str]]] = {}
        with ThreadPoolExecutor(max_workers=4) as pool:
            futures = {
                pool.submit(_fetch_section, section["id"], ticker.upper()): section["id"]
                for section in SECTION_DEFS
            }
            for future in as_completed(futures):
                section_id, records, message = future.result()
                section_results[section_id] = (records, message)

        sections = []
        for section_def in SECTION_DEFS:
            records, message = section_results.get(section_def["id"], ([], None))
            sections.append(
                {
                    **section_def,
                    "available": bool(records),
                    "message": message if not records else None,
                    "records": records,
                }
            )

        populated = sum(1 for s in sections if s["records"])
        message = None
        if populated == 0:
            message = f"No recent Quiver records found for {ticker}."

        return {
            **base_response,
            "sections": sections,
            "message": message,
        }

    try:
        return cached(cache_key, fetch, ttl_seconds=600)
    except Exception as exc:
        logger.error("Quiver intelligence fetch failed for %r: %s", query, exc)
        return {
            **base_response,
            "message": "Quiver data temporarily unavailable. Try again shortly.",
            "sections": [
                {
                    **section,
                    "available": False,
                    "message": "Fetch failed",
                    "records": [],
                }
                for section in SECTION_DEFS
            ],
        }
