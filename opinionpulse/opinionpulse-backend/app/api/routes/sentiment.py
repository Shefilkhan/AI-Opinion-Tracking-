from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user
from app.api.project_deps import get_owned_mention, get_owned_project
from app.db.database import get_db
from app.db.models import Mention, User
from app.schemas.sentiment import (
    AnalyzeProjectResponse,
    SentimentResultResponse,
    SentimentSummaryResponse,
    SentimentTrendItem,
    SentimentTrendsResponse,
)
from app.services import sentiment_service

router = APIRouter(prefix="/api", tags=["sentiment"])


@router.post(
    "/projects/{project_id}/sentiment/analyze",
    response_model=AnalyzeProjectResponse,
)
def analyze_project_sentiment(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_owned_project(project_id, current_user, db)
    mention_count = (
        db.query(Mention).filter(Mention.project_id == project.id).count()
    )
    if mention_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project has no mentions to analyze. Add or seed mentions first.",
        )

    counts = sentiment_service.analyze_project_mentions(db, project.id)
    return AnalyzeProjectResponse(
        analyzed=counts["analyzed"],
        positive=counts["positive"],
        neutral=counts["neutral"],
        negative=counts["negative"],
        message="Sentiment analysis completed successfully",
    )


@router.post(
    "/mentions/{mention_id}/sentiment/analyze",
    response_model=SentimentResultResponse,
)
def analyze_single_mention_sentiment(
    mention_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    mention = (
        db.query(Mention)
        .options(joinedload(Mention.sentiment_result))
        .filter(Mention.id == mention_id)
        .first()
    )
    if mention is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mention not found",
        )
    get_owned_project(mention.project_id, current_user, db)

    result = sentiment_service.analyze_mention(db, mention)
    return SentimentResultResponse.model_validate(result)


@router.get(
    "/projects/{project_id}/sentiment/summary",
    response_model=SentimentSummaryResponse,
)
def get_project_sentiment_summary(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_owned_project(project_id, current_user, db)
    summary = sentiment_service.get_project_sentiment_summary(db, project.id)
    return SentimentSummaryResponse(**summary)


@router.get(
    "/projects/{project_id}/sentiment/trends",
    response_model=SentimentTrendsResponse,
)
def get_project_sentiment_trends(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_owned_project(project_id, current_user, db)
    trends = sentiment_service.get_project_sentiment_trends(db, project.id)
    return SentimentTrendsResponse(
        trends=[SentimentTrendItem(**item) for item in trends]
    )


@router.get(
    "/mentions/{mention_id}/sentiment",
    response_model=SentimentResultResponse,
)
def get_mention_sentiment(
    mention_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    mention = get_owned_mention(mention_id, current_user, db)
    if mention.sentiment_result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No sentiment analysis for this mention yet",
        )
    return SentimentResultResponse.model_validate(mention.sentiment_result)
