"""Pydantic schemas for Early-Warning Pulse & Crisis Radar."""

from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

Quadrant = Literal["quiet", "noise", "watch", "crisis"]


class CrisisNarrative(BaseModel):
    id: str
    label: str
    summary: str
    severity: Literal["low", "medium", "high", "critical"]
    negative_pct: float
    mention_count: int
    primary_platform: str
    example_snippet: str
    example_url: Optional[str] = None


class TimelineNode(BaseModel):
    id: str
    platform: str
    title: str
    snippet: str
    source_url: Optional[str] = None
    posted_at: Optional[str] = None
    minutes_after_origin: Optional[int] = None
    role: Literal["origin", "spread", "amplification"] = "spread"


class RadarPoint(BaseModel):
    watch_id: str
    keyword: str
    enabled: bool
    volume_score: float = Field(description="0–100: how many mentions in the last 30 minutes")
    velocity_score: float = Field(description="0–100: how fast negativity is accelerating")
    quadrant: Quadrant
    status_label: str
    status_explanation: str
    mention_count_30m: int
    negative_count_30m: int
    negative_pct_30m: float
    baseline_negative_30m: float
    last_scanned_at: Optional[str] = None
    in_crisis: bool = False


class CrisisRadarResponse(BaseModel):
    points: list[RadarPoint]
    legend: dict[str, str]
    last_updated: str
    scan_interval_minutes: int


class CrisisDetailResponse(BaseModel):
    watch_id: str
    keyword: str
    quadrant: Quadrant
    volume_score: float
    velocity_score: float
    status_label: str
    status_explanation: str
    mention_count_30m: int
    negative_count_30m: int
    negative_pct_30m: float
    narratives: list[CrisisNarrative]
    timeline: list[TimelineNode]
    recent_events: list["CrisisEventOut"]
    last_scanned_at: Optional[str] = None


class CrisisEventOut(BaseModel):
    id: str
    query: str
    quadrant: Quadrant
    volume_score: float
    velocity_score: float
    status_label: str
    summary: Optional[str] = None
    alert_sent: bool
    created_at: datetime


class CrisisScanResponse(BaseModel):
    watch_id: str
    keyword: str
    scanned: bool
    quadrant: Quadrant
    message: str
    detail: Optional[CrisisDetailResponse] = None
