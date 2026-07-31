import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException
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
from app.services.plan_limits import (
    LimitExceededError,
    check_search_limit,
    check_time_range_access,
    resolve_plan_sources,
)
from app.services.plan_service import get_user_plan, increment_usage

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

    check_search_limit(current_user.id, db)
    time_range = check_time_range_access(current_user.id, body.time_range, db)
    allowed_sources, blocked_sources = resolve_plan_sources(
        current_user.id, body.platform, db
    )
    if not allowed_sources:
        raise LimitExceededError(
            "No accessible data sources for your plan on this filter. "
            "Upgrade to Pro for all 13+ sources.",
            upgrade_to="pro",
        )

    try:
        data = await asyncio.wait_for(
            search_service.run_search(
                query=body.query.strip(),
                platform=body.platform,
                time_range=time_range,
                sentiment=body.sentiment,
                sort_by=body.sort_by,
                source_allowlist=allowed_sources,
                language=body.language,
            ),
            timeout=60.0,
        )
    except asyncio.TimeoutError:
        logger.error('Search timed out for query="%s"', body.query)
        raise HTTPException(
            status_code=504,
            detail="Search timed out while fetching live sources. Try again or narrow filters.",
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

    increment_usage(current_user.id, "searches_used", db)

    response_data = dict(data)
    if blocked_sources:
        response_data["locked_sources"] = blocked_sources
        response_data["upgrade_message"] = (
            f"{len(blocked_sources)} more sources available on Pro plan"
        )
    return SearchResponse(**response_data)


@router.get("/search/history", response_model=SearchHistoryListResponse)
def list_search_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = get_user_plan(current_user.id, db)
    max_days = plan.get("search_history_days", 7)
    query = (
        db.query(SearchHistory)
        .filter(SearchHistory.user_id == current_user.id)
        .order_by(SearchHistory.searched_at.desc())
    )
    if max_days != -1:
        from datetime import datetime, timedelta, timezone

        cutoff = datetime.now(timezone.utc) - timedelta(days=max_days)
        query = query.filter(SearchHistory.searched_at >= cutoff)
    rows = query.limit(50).all()
    return SearchHistoryListResponse(
        items=[SearchHistoryItem.model_validate(r) for r in rows]
    )
