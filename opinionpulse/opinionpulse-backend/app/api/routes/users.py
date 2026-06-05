"""User profile, stats, and avatar endpoints."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.db.models import User
from app.schemas.account import AccountProfileResponse, AccountProfileUpdate, AccountStatsResponse
from app.services.user_profile_service import (
    apply_profile_updates,
    get_user_stats,
    profile_to_response,
    validate_username,
)

router = APIRouter(prefix="/api/users", tags=["users"])

UPLOAD_DIR = Path(__file__).resolve().parents[3] / "uploads" / "avatars"
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_AVATAR_BYTES = 2 * 1024 * 1024


@router.get("/stats", response_model=AccountStatsResponse)
def get_user_stats_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_user_stats(db, current_user)


@router.patch("/profile", response_model=AccountProfileResponse)
def patch_user_profile(
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


@router.get("/username/check")
def check_username_available(
    username: str = Query(..., min_length=1, max_length=30),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    validate_username(username)
    taken = (
        db.query(User)
        .filter(
            User.username == username.strip(),
            User.id != current_user.id,
        )
        .first()
    )
    reserved = username.strip().lower() in {
        "admin",
        "opinionpulse",
        "support",
        "test",
        "user",
    }
    return {"available": not taken and not reserved}


@router.post("/avatar")
async def upload_user_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPG, PNG, WebP allowed",
        )

    content = await file.read()
    if len(content) > MAX_AVATAR_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large (max 2MB)",
        )

    ext_map = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
    }
    ext = ext_map.get(file.content_type or "", "jpg")
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{current_user.id}.{ext}"
    filepath = UPLOAD_DIR / filename
    filepath.write_bytes(content)

    avatar_url = f"/uploads/avatars/{filename}"
    current_user.avatar_url = avatar_url
    db.commit()
    return {"avatar_url": avatar_url}
