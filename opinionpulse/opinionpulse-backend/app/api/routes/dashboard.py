from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.db.models import User
from app.schemas.dashboard import (
    DashboardOverviewResponse,
    LiveDebateItem,
    MostDiscussedItem,
    TopicsTableResponse,
)
from app.services.dashboard_debates_service import get_live_debates, get_most_discussed
from app.services.dashboard_live_service import get_dashboard_overview
from app.services.dashboard_topics_table_service import get_topics_table

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/overview", response_model=DashboardOverviewResponse)
def dashboard_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return DashboardOverviewResponse(**get_dashboard_overview(db=db))


@router.get("/debates", response_model=list[LiveDebateItem])
def dashboard_debates(
    current_user: User = Depends(get_current_user),
):
    return [LiveDebateItem(**d) for d in get_live_debates()]


@router.get("/most-discussed", response_model=list[MostDiscussedItem])
def dashboard_most_discussed(
    current_user: User = Depends(get_current_user),
):
    return [MostDiscussedItem(**d) for d in get_most_discussed()]


@router.get("/topics-table", response_model=TopicsTableResponse)
def dashboard_topics_table(
    sort_by: str = Query("engagement"),
    sort_order: str = Query("desc"),
    timeframe: str = Query("7d"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if timeframe not in ("24h", "7d", "30d"):
        timeframe = "7d"
    if sort_by not in ("engagement", "sentiment", "mentions", "recent"):
        sort_by = "engagement"
    if sort_order not in ("asc", "desc"):
        sort_order = "desc"
    data = get_topics_table(
        db,
        sort_by=sort_by,
        sort_order=sort_order,
        timeframe=timeframe,
    )
    return TopicsTableResponse(**data)
