"""Alert channel preferences for brand monitoring."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.db.models import User, UserAlertPreferences


def get_or_create_preferences(db: Session, user_id: int) -> UserAlertPreferences:
    row = (
        db.query(UserAlertPreferences)
        .filter(UserAlertPreferences.user_id == user_id)
        .first()
    )
    if row is None:
        row = UserAlertPreferences(user_id=user_id)
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


def prefs_to_dict(prefs: UserAlertPreferences) -> dict:
    url = prefs.slack_webhook_url or ""
    return {
        "email_crisis": prefs.email_crisis,
        "email_weekly_report": prefs.email_weekly_report,
        "slack_crisis": prefs.slack_crisis,
        "slack_webhook_url": prefs.slack_webhook_url,
        "slack_configured": bool(url.startswith("https://hooks.slack.com/")),
    }


def should_email_crisis(db: Session, user: User) -> bool:
    prefs = get_or_create_preferences(db, user.id)
    return prefs.email_crisis


def should_slack_crisis(db: Session, user: User) -> tuple[bool, str | None]:
    prefs = get_or_create_preferences(db, user.id)
    if not prefs.slack_crisis:
        return False, None
    url = (prefs.slack_webhook_url or "").strip()
    if not url.startswith("https://hooks.slack.com/"):
        return False, None
    return True, url
