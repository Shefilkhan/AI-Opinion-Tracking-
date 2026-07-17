from datetime import timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.services.user_profile_service import validate_username
from app.core.security import hash_password, verify_password
from app.db.database import get_db
from app.db.models import User
from app.schemas.account import (
    AccountPasswordUpdate,
    AccountProfileResponse,
    AccountProfileUpdate,
    AccountStatsResponse,
)
from app.schemas.usage import UsageStatusResponse
from app.services.notification_service import create_user_notification
from app.services.plan_limits import plan_features_for_client
from app.services.plan_service import get_or_create_usage, get_user_plan
from app.services.user_profile_service import (
    apply_profile_updates,
    get_user_stats,
    profile_to_response,
)

router = APIRouter(prefix="/api/account", tags=["account"])


@router.get("/profile", response_model=AccountProfileResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return profile_to_response(current_user)


@router.put("/profile", response_model=AccountProfileResponse)
def update_profile(
    payload: AccountProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = payload.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid fields to update",
        )

    if "username" in data and data["username"]:
        validate_username(data["username"])
        existing = (
            db.query(User)
            .filter(
                User.username == data["username"].strip(),
                User.id != current_user.id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken",
            )

    apply_profile_updates(current_user, data)
    db.commit()
    db.refresh(current_user)
    return profile_to_response(current_user)


@router.put("/password")
def update_password(
    payload: AccountPasswordUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New passwords do not match",
        )
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    current_user.password_hash = hash_password(payload.new_password)
    create_user_notification(
        db,
        user_id=current_user.id,
        type="security",
        title="Password updated",
        message="Your account password was changed successfully.",
        href="/settings#privacy",
    )
    db.commit()
    return {"message": "Password updated successfully"}


@router.get("/stats", response_model=AccountStatsResponse)
def get_account_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_user_stats(db, current_user)


def _usage_percent(used: int, limit: int) -> Optional[int]:
    if limit == -1:
        return None
    if limit <= 0:
        return 100
    return min(round((used / limit) * 100), 100)


@router.get("/usage", response_model=UsageStatusResponse)
def get_usage_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = get_user_plan(current_user.id, db)
    usage = get_or_create_usage(current_user.id, db)
    features = plan_features_for_client(plan)

    renews_at = current_user.plan_renews_at
    if renews_at is not None and renews_at.tzinfo is None:
        renews_at = renews_at.replace(tzinfo=timezone.utc)

    return UsageStatusResponse(
        plan={
            "id": plan["id"],
            "name": plan["name"],
            "status": plan.get("_status", "active"),
        },
        billing={
            "available": bool(current_user.stripe_subscription_id),
            "renews_at": renews_at.isoformat() if renews_at else None,
        },
        usage={
            "searches": {
                "used": usage["searches_used"],
                "limit": plan["searches_per_month"],
                "percent": _usage_percent(
                    usage["searches_used"], plan["searches_per_month"]
                ),
            },
            "chat_messages_today": {
                "used": usage["chat_messages_used_today"],
                "limit": plan["chat_messages_per_day"],
                "percent": _usage_percent(
                    usage["chat_messages_used_today"],
                    plan["chat_messages_per_day"],
                ),
            },
            "csv_exports": {
                "used": usage["csv_exports_used"],
                "limit": plan["csv_export_max_rows"],
            },
        },
        period={
            "start": str(usage["period_start"]),
            "end": str(usage["period_end"]),
        },
        features=features,
    )
