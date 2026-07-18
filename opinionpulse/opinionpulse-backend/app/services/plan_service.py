"""Subscription plan config cache and per-user usage tracking."""

from __future__ import annotations

import calendar
import uuid
from datetime import date, datetime, timezone
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.db.models import Plan, UsageTracking, User

PLAN_CACHE: dict[str, dict[str, Any]] = {}

STARTER_PLAN_FALLBACK: dict[str, Any] = {
    "id": "starter",
    "name": "Starter",
    "price_monthly_cents": 0,
    "searches_per_month": 100,
    "data_sources_json": [
        "reddit",
        "hackernews",
        "devto",
        "newsapi",
        "guardian",
        "bluesky",
        "mastodon",
    ],
    "search_history_days": 7,
    "csv_export_max_rows": 100,
    "ai_opinion_summary": False,
    "ai_debate_analysis": False,
    "ai_trend_prediction": False,
    "realtime_alerts_max": 0,
    "chat_messages_per_day": 5,
    "chat_history_days": 7,
    "api_access": False,
    "team_members_max": 1,
    "sso_enabled": False,
    "support_tier": "email",
}

USAGE_FIELDS = frozenset(
    {
        "searches_used",
        "chat_messages_used_today",
        "csv_exports_used",
        "ai_summary_calls",
        "ai_debate_calls",
        "ai_trend_calls",
    }
)


def _plan_row_to_dict(plan: Plan) -> dict[str, Any]:
    return {
        "id": plan.id,
        "name": plan.name,
        "price_monthly_cents": plan.price_monthly_cents,
        "searches_per_month": plan.searches_per_month,
        "data_sources_json": plan.data_sources_json,
        "search_history_days": plan.search_history_days,
        "csv_export_max_rows": plan.csv_export_max_rows,
        "ai_opinion_summary": plan.ai_opinion_summary,
        "ai_debate_analysis": plan.ai_debate_analysis,
        "ai_trend_prediction": plan.ai_trend_prediction,
        "realtime_alerts_max": plan.realtime_alerts_max,
        "chat_messages_per_day": plan.chat_messages_per_day,
        "chat_history_days": plan.chat_history_days,
        "api_access": plan.api_access,
        "team_members_max": plan.team_members_max,
        "sso_enabled": plan.sso_enabled,
        "support_tier": plan.support_tier,
    }


def load_plans(db: Session) -> dict[str, dict[str, Any]]:
    """Load all plans into memory cache on app startup."""
    PLAN_CACHE.clear()
    for row in db.query(Plan).all():
        PLAN_CACHE[row.id] = _plan_row_to_dict(row)
    if not PLAN_CACHE:
        PLAN_CACHE["starter"] = dict(STARTER_PLAN_FALLBACK)
    return PLAN_CACHE


def seed_default_plans(db: Session) -> None:
    """Insert or update the three reference plans."""
    defaults = [
        {
            "id": "starter",
            "name": "Starter",
            "price_monthly_cents": 0,
            "searches_per_month": 100,
            "data_sources_json": [
                "reddit",
                "hackernews",
                "devto",
                "newsapi",
                "guardian",
                "bluesky",
                "mastodon",
            ],
            "search_history_days": 7,
            "csv_export_max_rows": 100,
            "ai_opinion_summary": False,
            "ai_debate_analysis": False,
            "ai_trend_prediction": False,
            "realtime_alerts_max": 0,
            "chat_messages_per_day": 5,
            "chat_history_days": 7,
            "api_access": False,
            "team_members_max": 1,
            "sso_enabled": False,
            "support_tier": "email",
        },
        {
            "id": "pro",
            "name": "Pro",
            "price_monthly_cents": 2900,
            "searches_per_month": -1,
            "data_sources_json": "all",
            "search_history_days": 30,
            "csv_export_max_rows": -1,
            "ai_opinion_summary": True,
            "ai_debate_analysis": True,
            "ai_trend_prediction": True,
            "realtime_alerts_max": 5,
            "chat_messages_per_day": 100,
            "chat_history_days": 30,
            "api_access": False,
            "team_members_max": 1,
            "sso_enabled": False,
            "support_tier": "priority_email",
        },
        {
            "id": "enterprise",
            "name": "Enterprise",
            "price_monthly_cents": 9900,
            "searches_per_month": -1,
            "data_sources_json": "all",
            "search_history_days": 365,
            "csv_export_max_rows": -1,
            "ai_opinion_summary": True,
            "ai_debate_analysis": True,
            "ai_trend_prediction": True,
            "realtime_alerts_max": -1,
            "chat_messages_per_day": -1,
            "chat_history_days": 365,
            "api_access": True,
            "team_members_max": 10,
            "sso_enabled": True,
            "support_tier": "dedicated_slack",
        },
    ]
    for spec in defaults:
        existing = db.get(Plan, spec["id"])
        if existing:
            for key, value in spec.items():
                if key != "id":
                    setattr(existing, key, value)
        else:
            db.add(Plan(**spec))
    db.commit()


def get_plan_config(plan_id: str) -> dict[str, Any]:
    """Get plan config from cache, fallback to starter."""
    return PLAN_CACHE.get(plan_id) or PLAN_CACHE.get("starter") or STARTER_PLAN_FALLBACK


def parse_data_sources(raw: Any) -> list[str] | str:
    if raw == "all" or raw is None:
        return "all"
    if isinstance(raw, list):
        return raw
    if isinstance(raw, str):
        if raw.strip() == "all":
            return "all"
        try:
            import json

            parsed = json.loads(raw)
            if parsed == "all":
                return "all"
            if isinstance(parsed, list):
                return parsed
        except (json.JSONDecodeError, TypeError):
            pass
    # Fail CLOSED on malformed config: default to the Starter source set, not
    # "all", so a corrupt data_sources_json can't silently grant every source.
    return ["reddit", "hackernews", "devto", "newsapi", "guardian", "bluesky", "mastodon"]


def get_user_plan(user_id: int, db: Session) -> dict[str, Any]:
    """Get user's current plan + status, checking for expiry."""
    user = db.get(User, user_id)
    if not user:
        return dict(get_plan_config("starter"))

    plan_id = user.plan_id or "starter"
    if user.plan_status == "past_due" and user.plan_renews_at:
        now = datetime.now(timezone.utc)
        renews = user.plan_renews_at
        if renews.tzinfo is None:
            renews = renews.replace(tzinfo=timezone.utc)
        days_overdue = (now - renews).days
        if days_overdue > 3:
            user.plan_id = "starter"
            user.plan_status = "active"
            db.commit()
            plan_id = "starter"

    plan = dict(get_plan_config(plan_id))
    plan["_status"] = user.plan_status or "active"
    return plan


def _current_period() -> tuple[date, date]:
    today = date.today()
    last_day = calendar.monthrange(today.year, today.month)[1]
    return date(today.year, today.month, 1), date(today.year, today.month, last_day)


def get_or_create_usage(user_id: int, db: Session) -> dict[str, Any]:
    """Get current period usage row, creating if needed."""
    start, end = _current_period()
    usage = (
        db.query(UsageTracking)
        .filter(
            UsageTracking.user_id == user_id,
            UsageTracking.period_start == start,
        )
        .first()
    )
    if usage:
        return {
            "id": usage.id,
            "user_id": usage.user_id,
            "period_start": usage.period_start,
            "period_end": usage.period_end,
            "searches_used": usage.searches_used,
            "chat_messages_used_today": usage.chat_messages_used_today,
            "chat_messages_today_date": usage.chat_messages_today_date,
            "csv_exports_used": usage.csv_exports_used,
            "ai_summary_calls": usage.ai_summary_calls,
            "ai_debate_calls": usage.ai_debate_calls,
            "ai_trend_calls": usage.ai_trend_calls,
        }

    from sqlalchemy.exc import IntegrityError

    row = UsageTracking(
        id=str(uuid.uuid4()),
        user_id=user_id,
        period_start=start,
        period_end=end,
    )
    db.add(row)
    try:
        db.commit()
        db.refresh(row)
    except IntegrityError:
        # Concurrent first-request-of-period created the row first; reuse it.
        db.rollback()
        return get_or_create_usage(user_id, db)
    return {
        "id": row.id,
        "user_id": row.user_id,
        "period_start": row.period_start,
        "period_end": row.period_end,
        "searches_used": 0,
        "chat_messages_used_today": 0,
        "chat_messages_today_date": None,
        "csv_exports_used": 0,
        "ai_summary_calls": 0,
        "ai_debate_calls": 0,
        "ai_trend_calls": 0,
    }


def increment_usage(
    user_id: int, field: str, db: Session, amount: int = 1
) -> None:
    """Increment a usage counter for the current billing period."""
    if field not in USAGE_FIELDS:
        raise ValueError(f"Invalid usage field: {field}")
    get_or_create_usage(user_id, db)
    start, _ = _current_period()
    row = (
        db.query(UsageTracking)
        .filter(
            UsageTracking.user_id == user_id,
            UsageTracking.period_start == start,
        )
        .first()
    )
    if not row:
        return
    current = getattr(row, field, 0) or 0
    setattr(row, field, current + amount)
    db.commit()


def reset_daily_chat_if_needed(user_id: int, db: Session) -> None:
    """Reset daily chat counter if it's a new day."""
    today = date.today()
    usage = get_or_create_usage(user_id, db)
    last_date = usage.get("chat_messages_today_date")
    if last_date == today:
        return
    start, _ = _current_period()
    row = (
        db.query(UsageTracking)
        .filter(
            UsageTracking.user_id == user_id,
            UsageTracking.period_start == start,
        )
        .first()
    )
    if not row:
        return
    row.chat_messages_used_today = 0
    row.chat_messages_today_date = today
    db.commit()
