from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_user
from app.db.database import get_db
from app.db.models import User
from app.schemas.market import MarketChartResponse, WatchMarketChartsResponse
from app.schemas.quiver import QuiverIntelligenceResponse
from app.services.brand_watch_service import build_search_terms, parse_watch_meta
from app.services.market_data_service import get_price_chart, get_price_charts_for_watches
from app.services.pulse_monitor_service import _alert_rows_for_user
from app.services.quiver_data_service import get_quiver_intelligence
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/market", tags=["market"])


@router.get("/chart", response_model=MarketChartResponse)
def market_price_chart(
    q: str = Query(..., min_length=1, max_length=100, description="Watch keyword"),
    _current_user: User = Depends(get_current_user),
):
    """7-day crypto or 5-day stock price chart for a brand-watch keyword."""
    data = get_price_chart(q.strip())
    return MarketChartResponse(**data)


@router.get("/charts/watches", response_model=WatchMarketChartsResponse)
def market_charts_for_watches(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Live price charts for every enabled brand watch on Crisis Radar."""
    watches = _alert_rows_for_user(db, current_user.id)
    payload = []
    for row in watches:
        meta = parse_watch_meta(row)
        terms = build_search_terms(meta, row.query)
        payload.append(
            {
                "watch_id": row.id,
                "query": row.query,
                "terms": terms,
            }
        )
    charts = get_price_charts_for_watches(payload)
    return WatchMarketChartsResponse(charts=charts)


@router.get("/quiver", response_model=QuiverIntelligenceResponse)
def market_quiver_intelligence(
    q: str = Query(..., min_length=1, max_length=100, description="Watch keyword"),
    _current_user: User = Depends(get_current_user),
):
    """Alternative market intelligence from Quiver Quant (congress, insiders, 13F, etc.)."""
    data = get_quiver_intelligence(q.strip())
    return QuiverIntelligenceResponse(**data)
