from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


class QuiverRecord(BaseModel):
    title: str
    subtitle: Optional[str] = None
    date: Optional[str] = None
    detail: Optional[str] = None
    amount: Optional[str] = None
    meta: dict[str, str] = Field(default_factory=dict)


class QuiverSection(BaseModel):
    id: str
    label: str
    emoji: str
    description: str
    available: bool = True
    message: Optional[str] = None
    records: list[QuiverRecord] = Field(default_factory=list)


class QuiverIntelligenceResponse(BaseModel):
    query: str
    ticker: Optional[str] = None
    configured: bool
    asset_type: Literal["stock", "crypto", "unknown"]
    sections: list[QuiverSection] = Field(default_factory=list)
    source: str = "Quiver Quantitative"
    message: Optional[str] = None
