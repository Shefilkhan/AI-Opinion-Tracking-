"""Plan limit checks — raises HTTP 402 when limits are exceeded."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.db.models import SavedSearch
from app.services.plan_service import (
    get_or_create_usage,
    get_user_plan,
    parse_data_sources,
    reset_daily_chat_if_needed,
)
from app.services.search_service import _resolve_sources, apis_configured

TIME_RANGE_DAYS = {"24h": 1, "7d": 7, "30d": 30}

FEATURE_LABELS = {
    "ai_opinion_summary": "AI Opinion Summary",
    "ai_debate_analysis": "AI Debate Analysis",
    "ai_trend_prediction": "AI Trend Prediction",
}


class LimitExceededError(HTTPException):
    def __init__(self, message: str, upgrade_to: str = "pro"):
        super().__init__(
            status_code=402,
            detail={
                "error": "limit_exceeded",
                "message": message,
                "upgrade_to": upgrade_to,
                "upgrade_url": "/pricing",
            },
        )


def filter_sources_by_plan(
    requested_sources: list[str], allowed: list[str] | str
) -> tuple[list[str], list[str]]:
    if allowed == "all":
        return requested_sources, []
    allowed_set = set(allowed)
    filtered = [s for s in requested_sources if s in allowed_set]
    blocked = [s for s in requested_sources if s not in allowed_set]
    return filtered, blocked


def resolve_plan_sources(
    user_id: int, platform_filter: str, db: Session
) -> tuple[list[str], list[str]]:
    """Resolve API sources for a search, filtered by the user's plan."""
    plan = get_user_plan(user_id, db)
    allowed = parse_data_sources(plan.get("data_sources_json"))
    configured = apis_configured()
    requested = _resolve_sources(platform_filter, configured)
    return filter_sources_by_plan(requested, allowed)


def check_search_limit(user_id: int, db: Session) -> None:
    plan = get_user_plan(user_id, db)
    usage = get_or_create_usage(user_id, db)
    limit = plan["searches_per_month"]
    if limit == -1:
        return
    if usage["searches_used"] >= limit:
        raise LimitExceededError(
            f"You've used all {limit} searches this month on the "
            f"{plan['name']} plan. Upgrade to Pro for unlimited searches.",
            upgrade_to="pro",
        )


def check_time_range_access(user_id: int, time_range: str, db: Session) -> str:
    """Return time_range, possibly raising if beyond plan history window."""
    plan = get_user_plan(user_id, db)
    max_days = plan["search_history_days"]
    if max_days == -1:
        return time_range
    requested_days = TIME_RANGE_DAYS.get(time_range, 1)
    if requested_days > max_days:
        raise LimitExceededError(
            f"Time ranges beyond {max_days} days require a higher plan. "
            f"Upgrade to Pro for 30-day history.",
            upgrade_to="pro",
        )
    return time_range


def check_ai_feature_access(user_id: int, feature: str, db: Session) -> None:
    plan = get_user_plan(user_id, db)
    if not plan.get(feature, False):
        label = FEATURE_LABELS.get(feature, feature)
        raise LimitExceededError(
            f"{label} is available on Pro and Enterprise plans. "
            "Upgrade to unlock AI insights.",
            upgrade_to="pro",
        )


def check_chat_limit(user_id: int, db: Session) -> None:
    reset_daily_chat_if_needed(user_id, db)
    plan = get_user_plan(user_id, db)
    usage = get_or_create_usage(user_id, db)
    limit = plan["chat_messages_per_day"]
    if limit == -1:
        return
    if usage["chat_messages_used_today"] >= limit:
        raise LimitExceededError(
            f"You've reached your daily limit of {limit} Pulse AI "
            f"messages on the {plan['name']} plan. Upgrade for more.",
            upgrade_to="pro",
        )


def check_csv_export_limit(
    user_id: int, requested_rows: int, db: Session
) -> int:
    plan = get_user_plan(user_id, db)
    max_rows = plan["csv_export_max_rows"]
    if max_rows == -1:
        return requested_rows
    return min(requested_rows, max_rows)


def check_keyword_alert_limit(user_id: int, db: Session) -> None:
    plan = get_user_plan(user_id, db)
    max_alerts = plan["realtime_alerts_max"]
    if max_alerts == -1:
        return
    if max_alerts == 0:
        raise LimitExceededError(
            "Real-time keyword alerts are available on Pro and Enterprise plans.",
            upgrade_to="pro",
        )

    existing = (
        db.query(SavedSearch)
        .filter(
            SavedSearch.user_id == user_id,
            SavedSearch.alert_enabled.is_(True),
        )
        .count()
    )
    if existing >= max_alerts:
        raise LimitExceededError(
            f"You've reached your limit of {max_alerts} active "
            f"keyword alerts on the {plan['name']} plan.",
            upgrade_to="pro",
        )


def plan_features_for_client(plan: dict[str, Any]) -> dict[str, Any]:
    allowed = parse_data_sources(plan.get("data_sources_json"))
    return {
        "data_sources": allowed,
        "ai_opinion_summary": bool(plan.get("ai_opinion_summary")),
        "ai_debate_analysis": bool(plan.get("ai_debate_analysis")),
        "ai_trend_prediction": bool(plan.get("ai_trend_prediction")),
        "api_access": bool(plan.get("api_access")),
        "search_history_days": plan.get("search_history_days"),
        "chat_history_days": plan.get("chat_history_days"),
    }
