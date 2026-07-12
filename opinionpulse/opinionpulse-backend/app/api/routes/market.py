from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_user
from app.db.models import User
from app.schemas.market import MarketChartResponse
from app.schemas.quiver import QuiverIntelligenceResponse
from app.services.market_data_service import get_price_chart
from app.services.quiver_data_service import get_quiver_intelligence

router = APIRouter(prefix="/api/market", tags=["market"])


@router.get("/chart", response_model=MarketChartResponse)
def market_price_chart(
    q: str = Query(..., min_length=1, max_length=100, description="Watch keyword"),
    _current_user: User = Depends(get_current_user),
):
    """7-day crypto or 5-day stock price chart for a brand-watch keyword."""
    data = get_price_chart(q.strip())
    return MarketChartResponse(**data)


@router.get("/quiver", response_model=QuiverIntelligenceResponse)
def market_quiver_intelligence(
    q: str = Query(..., min_length=1, max_length=100, description="Watch keyword"),
    _current_user: User = Depends(get_current_user),
):
    """Alternative market intelligence from Quiver Quant (congress, insiders, 13F, etc.)."""
    data = get_quiver_intelligence(q.strip())
    return QuiverIntelligenceResponse(**data)
