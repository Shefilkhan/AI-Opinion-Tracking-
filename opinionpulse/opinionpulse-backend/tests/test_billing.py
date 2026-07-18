"""Billing helpers (E1/E6) — hermetic, no live Stripe."""
from __future__ import annotations

from datetime import datetime, timezone

from app.services import stripe_service


class _Prices:
    stripe_price_starter_monthly = "price_sm"
    stripe_price_starter_annual = "price_sa"
    stripe_price_pro_monthly = "price_pm"
    stripe_price_pro_annual = "price_pa"
    stripe_price_enterprise_monthly = "price_em"
    stripe_price_enterprise_annual = "price_ea"


class _EmptyPrices:
    stripe_price_starter_monthly = stripe_price_starter_annual = ""
    stripe_price_pro_monthly = stripe_price_pro_annual = ""
    stripe_price_enterprise_monthly = stripe_price_enterprise_annual = ""


def test_plan_id_from_price_reverse_map(monkeypatch):
    monkeypatch.setattr(stripe_service, "get_settings", lambda: _Prices())
    assert stripe_service.plan_id_from_price("price_pm") == "pro"
    assert stripe_service.plan_id_from_price("price_pa") == "pro"
    assert stripe_service.plan_id_from_price("price_ea") == "enterprise"
    assert stripe_service.plan_id_from_price("price_sm") == "starter"
    assert stripe_service.plan_id_from_price("price_unknown") is None
    assert stripe_service.plan_id_from_price("") is None
    assert stripe_service.plan_id_from_price(None) is None


def test_plan_id_from_price_ignores_empty_config(monkeypatch):
    # Unconfigured (empty) price ids must never match an empty input.
    monkeypatch.setattr(stripe_service, "get_settings", lambda: _EmptyPrices())
    assert stripe_service.plan_id_from_price("anything") is None
    assert stripe_service.plan_id_from_price("") is None


def test_parse_renews_at_reads_subscription_item():
    # E1: current_period_end lives on the item in Stripe 15.x.
    ts = 1_800_000_000
    sub = {"items": {"data": [{"current_period_end": ts}]}}
    result = stripe_service._parse_renews_at(sub)
    assert result == datetime.fromtimestamp(ts, tz=timezone.utc)


def test_parse_renews_at_prefers_top_level_when_present():
    ts = 1_700_000_000
    sub = {"current_period_end": ts, "items": {"data": []}}
    assert stripe_service._parse_renews_at(sub) == datetime.fromtimestamp(ts, tz=timezone.utc)


def test_parse_renews_at_none_when_absent():
    assert stripe_service._parse_renews_at({"items": {"data": []}}) is None
