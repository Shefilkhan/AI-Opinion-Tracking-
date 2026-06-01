from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.db.models import User
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    LatestSentimentSnapshot,
    RecentProjectItem,
    TrendingNewsResponse,
)
from app.services import dashboard_service

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
def dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = dashboard_service.get_dashboard_summary(db, current_user.id)
    latest = data.get("latest_sentiment")
    return DashboardSummaryResponse(
        total_projects=data["total_projects"],
        total_mentions=data["total_mentions"],
        total_analyzed=data["total_analyzed"],
        total_reports=data["total_reports"],
        recent_projects=[
            RecentProjectItem(**item) for item in data["recent_projects"]
        ],
        latest_sentiment=LatestSentimentSnapshot(**latest) if latest else None,
    )


@router.get("/trending", response_model=TrendingNewsResponse)
def dashboard_trending(current_user: User = Depends(get_current_user)):
    data = dashboard_service.get_trending_news()
    return TrendingNewsResponse(**data)
