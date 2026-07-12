"""Early-Warning Pulse & Crisis Radar API."""

import asyncio
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.db.models import CrisisEvent, SavedSearch, User
from app.schemas.crisis import (
    CrisisDetailResponse,
    CrisisEventOut,
    CrisisRadarResponse,
    CrisisScanResponse,
)
from app.services.pulse_metrics import QUADRANT_LABELS
from app.services.pulse_monitor_service import (
    _alert_rows_for_user,
    latest_bucket_for_watch,
    radar_point_from_bucket,
    scan_brand_watch,
)

import os

router = APIRouter(prefix="/api/crisis", tags=["crisis"])

SCAN_INTERVAL = int(os.getenv("PULSE_SCAN_INTERVAL_MINUTES", "10"))

RADAR_LEGEND = {
    "quiet": "Bottom-left — Normal activity. No action needed.",
    "noise": "Bottom-right — Lots of talk, but negativity is not accelerating.",
    "watch": "Top-left — Negativity is speeding up. Monitor closely.",
    "crisis": "Top-right — High volume + rapid acceleration. Act immediately.",
}


def _get_user_watch(watch_id: str, user: User, db: Session) -> SavedSearch:
    row = (
        db.query(SavedSearch)
        .filter(SavedSearch.id == watch_id, SavedSearch.user_id == user.id)
        .first()
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Watch not found")
    return row


def _events_for_watch(db: Session, user_id: int, watch_id: str, limit: int = 5) -> list[CrisisEventOut]:
    rows = (
        db.query(CrisisEvent)
        .filter(CrisisEvent.user_id == user_id, CrisisEvent.saved_search_id == watch_id)
        .order_by(CrisisEvent.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        CrisisEventOut(
            id=r.id,
            query=r.query,
            quadrant=r.quadrant,
            volume_score=r.volume_score,
            velocity_score=r.velocity_score,
            status_label=r.status_label,
            summary=r.summary,
            alert_sent=r.alert_sent,
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.get("/radar", response_model=CrisisRadarResponse)
def get_crisis_radar(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Crisis Radar matrix data for all of the user's brand watches."""
    watches = _alert_rows_for_user(db, current_user.id)
    points = [radar_point_from_bucket(w, latest_bucket_for_watch(db, w)) for w in watches]
    return CrisisRadarResponse(
        points=points,
        legend=RADAR_LEGEND,
        last_updated=datetime.now(timezone.utc).isoformat(),
        scan_interval_minutes=SCAN_INTERVAL,
    )


@router.get("/detail/{watch_id}", response_model=CrisisDetailResponse)
async def get_crisis_detail(
    watch_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    watch = _get_user_watch(watch_id, current_user, db)
    bucket = latest_bucket_for_watch(db, watch)
    point = radar_point_from_bucket(watch, bucket)

    latest_event = (
        db.query(CrisisEvent)
        .filter(
            CrisisEvent.user_id == current_user.id,
            CrisisEvent.saved_search_id == watch_id,
        )
        .order_by(CrisisEvent.created_at.desc())
        .first()
    )

    narratives = []
    timeline = []
    if latest_event and latest_event.narratives_json:
        narratives = latest_event.narratives_json.get("items", [])
    if latest_event and latest_event.timeline_json:
        timeline = latest_event.timeline_json

    return CrisisDetailResponse(
        watch_id=watch.id,
        keyword=watch.query,
        quadrant=point["quadrant"],
        volume_score=point["volume_score"],
        velocity_score=point["velocity_score"],
        status_label=point["status_label"],
        status_explanation=point["status_explanation"],
        mention_count_30m=point["mention_count_30m"],
        negative_count_30m=point["negative_count_30m"],
        negative_pct_30m=point["negative_pct_30m"],
        narratives=narratives,
        timeline=timeline,
        recent_events=_events_for_watch(db, current_user.id, watch_id),
        last_scanned_at=point.get("last_scanned_at"),
    )


@router.post("/scan/{watch_id}", response_model=CrisisScanResponse)
async def trigger_crisis_scan(
    watch_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Manually run a pulse scan for one brand watch."""
    watch = _get_user_watch(watch_id, current_user, db)
    result = await scan_brand_watch(db, watch, user=current_user, store_event=True)
    detail = result.get("detail")
    message = (
        f"Scan complete — {QUADRANT_LABELS.get(result['quadrant'], result['quadrant'])}. "
        f"{result['mention_count_30m']} mentions in the last 30 minutes."
    )
    if result.get("alert_sent"):
        message += " Crisis email alert sent."

    detail_model = None
    if detail:
        detail_model = CrisisDetailResponse(
            **detail,
            recent_events=_events_for_watch(db, current_user.id, watch_id),
        )

    return CrisisScanResponse(
        watch_id=watch_id,
        keyword=watch.query,
        scanned=True,
        quadrant=result["quadrant"],
        message=message,
        detail=detail_model,
    )


@router.get("/events", response_model=list[CrisisEventOut])
def list_crisis_events(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(CrisisEvent)
        .filter(CrisisEvent.user_id == current_user.id)
        .order_by(CrisisEvent.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        CrisisEventOut(
            id=r.id,
            query=r.query,
            quadrant=r.quadrant,
            volume_score=r.volume_score,
            velocity_score=r.velocity_score,
            status_label=r.status_label,
            summary=r.summary,
            alert_sent=r.alert_sent,
            created_at=r.created_at,
        )
        for r in rows
    ]
