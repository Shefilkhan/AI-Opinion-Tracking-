from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import hash_password, verify_password
from app.db.database import get_db
from app.db.models import SavedSearch, SearchHistory, User
from app.schemas.account import (
    AccountPasswordUpdate,
    AccountProfileResponse,
    AccountProfileUpdate,
    AccountStatsResponse,
)

router = APIRouter(prefix="/api/account", tags=["account"])


@router.get("/profile", response_model=AccountProfileResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return AccountProfileResponse.model_validate(current_user)


@router.put("/profile", response_model=AccountProfileResponse)
def update_profile(
    payload: AccountProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.name = payload.name.strip()
    db.commit()
    db.refresh(current_user)
    return AccountProfileResponse.model_validate(current_user)


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
    total_searches = (
        db.query(SearchHistory)
        .filter(SearchHistory.user_id == current_user.id)
        .count()
    )
    total_results = (
        db.query(func.coalesce(func.sum(SearchHistory.results_count), 0))
        .filter(SearchHistory.user_id == current_user.id)
        .scalar()
        or 0
    )
    saved_searches = (
        db.query(SavedSearch)
        .filter(SavedSearch.user_id == current_user.id)
        .count()
    )
    return AccountStatsResponse(
        total_searches=total_searches,
        total_results=int(total_results),
        saved_searches=saved_searches,
    )
