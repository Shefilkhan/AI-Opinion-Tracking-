import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.db.database import get_db
from app.db.models import SearchHistory, User
from app.schemas.search import (
    SearchHistoryItem,
    SearchHistoryListResponse,
    SearchRequest,
    SearchResponse,
)
from app.services import search_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["search"])


@router.post("/search", response_model=SearchResponse)
async def search_opinions(
    body: SearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s = get_settings()
    configured = search_service.apis_configured()
    logger.info(
        '🔍 Search request: query="%s" platform=%s',
        body.query,
        body.platform,
    )
    logger.info(
        "🔑 API keys: reddit=always, newsapi=%s, youtube=%s, guardian=%s, "
        "mediastack=%s, currents=%s, gnews=%s, devto=yes, hackernews=yes, wikipedia=yes",
        "✅" if configured["newsapi"] else "❌",
        "✅" if configured["youtube"] else "❌",
        "✅" if configured["guardian"] else "❌",
        "✅" if configured["mediastack"] else "❌",
        "✅" if configured["currents"] else "❌",
        "✅" if configured["gnews"] else "❌",
    )

    data = await search_service.run_search(
        query=body.query.strip(),
        platform=body.platform,
        time_range=body.time_range,
        sentiment=body.sentiment,
        sort_by=body.sort_by,
    )
    try:
        search_service.record_search_history(
            db,
            current_user.id,
            body.query,
            data["total_results"],
            data["sentiment_summary"],
        )
    except Exception as hist_err:
        logger.warning("Could not save search history: %s", hist_err)
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
