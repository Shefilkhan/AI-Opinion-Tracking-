from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.db.models import User, UserNotification

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


class NotificationOut(BaseModel):
    id: str
    type: str
    title: str
    message: str
    href: Optional[str] = None
    read: bool
    created_at: datetime


class NotificationsListResponse(BaseModel):
    items: list[NotificationOut]
    unread_count: int


def _to_out(row: UserNotification) -> NotificationOut:
    return NotificationOut(
        id=row.id,
        type=row.type,
        title=row.title,
        message=row.message,
        href=row.href,
        read=row.read_at is not None,
        created_at=row.created_at,
    )


def _get_notification(
    notification_id: str, user: User, db: Session
) -> UserNotification:
    row = (
        db.query(UserNotification)
        .filter(
            UserNotification.id == notification_id,
            UserNotification.user_id == user.id,
        )
        .first()
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return row


@router.get("", response_model=NotificationsListResponse)
def list_notifications(
    limit: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    capped = max(1, min(limit, 50))
    rows = (
        db.query(UserNotification)
        .filter(UserNotification.user_id == current_user.id)
        .order_by(UserNotification.created_at.desc())
        .limit(capped)
        .all()
    )
    unread_count = (
        db.query(UserNotification)
        .filter(
            UserNotification.user_id == current_user.id,
            UserNotification.read_at.is_(None),
        )
        .count()
    )
    return NotificationsListResponse(
        items=[_to_out(row) for row in rows],
        unread_count=unread_count,
    )


@router.patch("/{notification_id}/read", response_model=NotificationOut)
def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = _get_notification(notification_id, current_user, db)
    if row.read_at is None:
        row.read_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(row)
    return _to_out(row)


@router.post("/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    (
        db.query(UserNotification)
        .filter(
            UserNotification.user_id == current_user.id,
            UserNotification.read_at.is_(None),
        )
        .update({UserNotification.read_at: now}, synchronize_session=False)
    )
    db.commit()
    return {"success": True}
