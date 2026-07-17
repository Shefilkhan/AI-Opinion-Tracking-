"""Create in-app user notifications."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.db.models import UserNotification


def create_user_notification(
    db: Session,
    *,
    user_id: int,
    type: str,
    title: str,
    message: str,
    href: str | None = None,
) -> UserNotification:
    row = UserNotification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        href=href,
    )
    db.add(row)
    return row
