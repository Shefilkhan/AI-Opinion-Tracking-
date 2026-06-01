from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import hash_password, verify_password
from app.db.database import get_db
from app.db.models import ChatSession, Mention, Project, Report, SentimentResult, User
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
    project_ids = [
        p.id
        for p in db.query(Project.id).filter(Project.user_id == current_user.id).all()
    ]
    total_projects = len(project_ids)
    total_mentions = 0
    total_analyzed = 0
    if project_ids:
        total_mentions = (
            db.query(Mention).filter(Mention.project_id.in_(project_ids)).count()
        )
        total_analyzed = (
            db.query(SentimentResult)
            .join(Mention, SentimentResult.mention_id == Mention.id)
            .filter(Mention.project_id.in_(project_ids))
            .count()
        )
    total_reports = (
        db.query(Report).filter(Report.project_id.in_(project_ids)).count()
        if project_ids
        else 0
    )
    total_chat_sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .count()
    )
    return AccountStatsResponse(
        total_projects=total_projects,
        total_mentions=total_mentions,
        total_analyzed=total_analyzed,
        total_reports=total_reports,
        total_chat_sessions=total_chat_sessions,
    )
