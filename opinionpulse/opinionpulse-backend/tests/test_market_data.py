"""Tests for market asset resolution."""

from __future__ import annotations

from unittest.mock import patch

from app.services.market_data_service import (
    resolve_market_asset,
    resolve_market_asset_from_terms,
)


def test_resolve_openai_proxy():
    asset = resolve_market_asset("OpenAI")
    assert asset["asset_type"] == "stock"
    assert asset["symbol"] == "MSFT"
    assert asset.get("proxy_note")


def test_resolve_bitcoin_hardcoded():
    asset = resolve_market_asset("Bitcoin")
    assert asset["asset_type"] == "crypto"
    assert asset["coingecko_id"] == "bitcoin"


def test_resolve_ticker_symbol():
    asset = resolve_market_asset("NVDA")
    assert asset["asset_type"] == "stock"
    assert asset["symbol"] == "NVDA"


def test_resolve_from_terms_fallback():
    with patch(
        "app.services.market_data_service.resolve_market_asset",
        side_effect=lambda q: (
            {"asset_type": "unknown", "symbol": None, "name": q, "proxy_note": None}
            if q == "OpenAI"
            else {"asset_type": "stock", "symbol": "MSFT", "name": "Microsoft", "proxy_note": None}
        ),
    ):
        asset = resolve_market_asset_from_terms(["OpenAI", "Microsoft"])
    assert asset["symbol"] == "MSFT"


def test_yahoo_search_fallback():
    with patch(
        "app.services.market_data_service._search_coingecko_id",
        return_value=None,
    ), patch(
        "app.services.market_data_service._search_yahoo_ticker",
        return_value="NKE",
    ):
        asset = resolve_market_asset("Nike Inc")
    assert asset["asset_type"] == "stock"
    assert asset["symbol"] == "NKE"
