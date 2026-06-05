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
    db.commit()
    return {"message": "Password updated successfully"}


@router.get("/stats", response_model=AccountStatsResponse)
def get_account_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_user_stats(db, current_user)
