from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.project_deps import get_owned_project
from app.db.database import get_db
from app.db.models import User
from app.schemas.analytics import (
    AnalyticsOverviewResponse,
    SentimentDistributionItem,
    SourceSentimentItem,
    TopMentionItem,
    TopMentionsResponse,
)
from app.services import analytics_service

router = APIRouter(prefix="/api", tags=["analytics"])


@router.get(
    "/projects/{project_id}/analytics/overview",
    response_model=AnalyticsOverviewResponse,
)
def analytics_overview(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_owned_project(project_id, current_user, db)
    data = analytics_service.get_analytics_overview(db, project.id)
    return AnalyticsOverviewResponse(**data)


@router.get(
    "/projects/{project_id}/analytics/source-sentiment",
    response_model=List[SourceSentimentItem],
)
def analytics_source_sentiment(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_owned_project(project_id, current_user, db)
    items = analytics_service.get_source_sentiment(db, project.id)
    return [SourceSentimentItem(**item) for item in items]


@router.get(
    "/projects/{project_id}/analytics/sentiment-distribution",
    response_model=List[SentimentDistributionItem],
)
def analytics_sentiment_distribution(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_owned_project(project_id, current_user, db)
    items = analytics_service.get_sentiment_distribution(db, project.id)
    return [SentimentDistributionItem(**item) for item in items]


@router.get(
    "/projects/{project_id}/analytics/top-mentions",
    response_model=TopMentionsResponse,
)
def analytics_top_mentions(
    project_id: int,
    limit: int = Query(default=5, ge=1, le=20),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_owned_project(project_id, current_user, db)
    data = analytics_service.get_top_mentions(db, project.id, limit=limit)
    return TopMentionsResponse(
        top_positive=[TopMentionItem(**m) for m in data["top_positive"]],
        top_negative=[TopMentionItem(**m) for m in data["top_negative"]],
    )
