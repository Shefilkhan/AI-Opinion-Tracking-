from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.db.models import SearchHistory, User
from app.schemas.search import (
    SearchHistoryItem,
    SearchHistoryListResponse,
    SearchRequest,
    SearchResponse,
)
from app.services import search_service

router = APIRouter(prefix="/api", tags=["search"])


@router.post("/search", response_model=SearchResponse)
async def search_opinions(
    body: SearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = await search_service.run_search(
        query=body.query.strip(),
        platform=body.platform,
        time_range=body.time_range,
        sentiment=body.sentiment,
        sort_by=body.sort_by,
    )
    search_service.record_search_history(
        db,
        current_user.id,
        body.query,
        data["total_results"],
        data["sentiment_summary"],
    )
    return SearchResponse(**data)


@router.get("/search/history", response_model=SearchHistoryListResponse)
def list_search_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(SearchHistory)
        .filter(SearchHistory.user_id == current_user.id)
        .order_by(SearchHistory.searched_at.desc())
        .limit(50)
        .all()
    )
    return SearchHistoryListResponse(
        items=[SearchHistoryItem.model_validate(r) for r in rows]
    )
