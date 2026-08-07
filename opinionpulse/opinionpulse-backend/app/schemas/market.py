from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel


class PricePoint(BaseModel):
    time: str
    price: float


class MarketChartResponse(BaseModel):
    query: str
    asset_type: Literal["crypto", "stock", "unknown"]
    symbol: Optional[str] = None
    name: str
    current_price: Optional[float] = None
    change_pct: Optional[float] = None
    currency: str = "USD"
    points: list[PricePoint]
    message: Optional[str] = None
