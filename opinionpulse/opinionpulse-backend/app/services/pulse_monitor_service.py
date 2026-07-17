"""Orchestrate brand-watch scans, bucket storage, and crisis event creation."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.db.models import CrisisEvent, PulseBucket, SavedSearch, User
from app.services.crisis_narrative_service import cluster_narratives
from app.services.crisis_timeline_service import build_spread_timeline
from app.services.email_service import send_crisis_alert_email
from app.services.notification_service import create_user_notification
from app.services.pulse_metrics import (
    QUADRANT_EXPLANATIONS,
    QUADRANT_LABELS,
    bucket_counts,
    compute_metrics_from_history,
    filter_results_in_window,
    floor_to_bucket,
)
from app.services.search_service import run_search

logger = logging.getLogger(__name__)

BUCKET_MINUTES = 30
CRISIS_ALERT_COOLDOWN = timedelta(hours=2)


def _alert_rows_for_user(db: Session, user_id: int) -> list[SavedSearch]:
    rows = (
        db.query(SavedSearch)
        .filter(SavedSearch.user_id == user_id, SavedSearch.alert_enabled.is_(True))
        .order_by(SavedSearch.created_at.desc())
        .all()
    )
    return [r for r in rows if r.filters_json and "threshold" in r.filters_json]


def _historical_buckets(
    db: Session,
    *,
    user_id: int,
    saved_search_id: str,
    before: datetime,
    hours: int = 24,
) -> list[tuple[datetime, int, int]]:
    cutoff = before - timedelta(hours=hours)
    rows = (
        db.query(PulseBucket)
        .filter(
            PulseBucket.user_id == user_id,
            PulseBucket.saved_search_id == saved_search_id,
            PulseBucket.bucket_start >= cutoff,
            PulseBucket.bucket_start < before,
        )
        .order_by(PulseBucket.bucket_start.asc())
        .all()
    )
    return [(r.bucket_start, r.mention_count, r.negative_count) for r in rows]


def _upsert_bucket(
    db: Session,
    *,
    user_id: int,
    saved_search_id: str,
    query: str,
    bucket_start: datetime,
    counts: dict[str, int],
    volume_score: float,
    velocity_score: float,
    quadrant: str,
) -> PulseBucket:
    row = (
        db.query(PulseBucket)
        .filter(
            PulseBucket.saved_search_id == saved_search_id,
            PulseBucket.bucket_start == bucket_start,
        )
        .first()
    )
    if row is None:
        row = PulseBucket(
            user_id=user_id,
            saved_search_id=saved_search_id,
            query=query,
            bucket_start=bucket_start,
        )
        db.add(row)

    row.mention_count = counts["total"]
    row.positive_count = counts["positive"]
    row.negative_count = counts["negative"]
    row.neutral_count = counts["neutral"]
    row.volume_score = volume_score
    row.velocity_score = velocity_score
    row.quadrant = quadrant
    return row


def _recent_crisis_exists(
    db: Session,
    *,
    user_id: int,
    saved_search_id: str,
) -> bool:
    cutoff = datetime.now(timezone.utc) - CRISIS_ALERT_COOLDOWN
    return (
        db.query(CrisisEvent)
        .filter(
            CrisisEvent.user_id == user_id,
            CrisisEvent.saved_search_id == saved_search_id,
            CrisisEvent.quadrant == "crisis",
            CrisisEvent.created_at >= cutoff,
        )
        .first()
        is not None
    )


async def scan_brand_watch(
    db: Session,
    watch: SavedSearch,
    *,
    user: User | None = None,
    store_event: bool = True,
) -> dict:
    """Run live search, compute pulse metrics, optionally record crisis event."""
    now = datetime.now(timezone.utc)
    bucket_start = floor_to_bucket(now, BUCKET_MINUTES)
    window_start = now - timedelta(minutes=BUCKET_MINUTES)
    query = watch.query.strip()

    search_payload = await run_search(
        query=query,
        platform="all",
        time_range="24h",
        sentiment="all",
        sort_by="recent",
    )
    results = search_payload.get("results") or []
    window_results = filter_results_in_window(results, start=window_start, end=now)
    counts = bucket_counts(window_results)

    history = _historical_buckets(
        db,
        user_id=watch.user_id,
        saved_search_id=watch.id,
        before=bucket_start,
    )
    volume, velocity, baseline_neg, quadrant = compute_metrics_from_history(
        history,
        current_total=counts["total"],
        current_negative=counts["negative"],
    )

    _upsert_bucket(
        db,
        user_id=watch.user_id,
        saved_search_id=watch.id,
        query=query,
        bucket_start=bucket_start,
        counts=counts,
        volume_score=volume,
        velocity_score=velocity,
        quadrant=quadrant,
    )
    db.commit()

    neg_pct = (
        round(counts["negative"] / counts["total"] * 100, 1) if counts["total"] else 0.0
    )

    detail: dict | None = None
    event_id: str | None = None
    alert_sent = False

    if quadrant in ("watch", "crisis") and store_event:
        narratives = await cluster_narratives(query, window_results or results)
        timeline = build_spread_timeline(window_results or results)
        summary = (
            narratives[0]["summary"]
            if narratives
            else QUADRANT_EXPLANATIONS.get(quadrant, "")
        )

        should_alert = quadrant == "crisis" and not _recent_crisis_exists(
            db, user_id=watch.user_id, saved_search_id=watch.id
        )

        event = CrisisEvent(
            user_id=watch.user_id,
            saved_search_id=watch.id,
            query=query,
            quadrant=quadrant,
            volume_score=volume,
            velocity_score=velocity,
            status_label=QUADRANT_LABELS.get(quadrant, quadrant),
            summary=summary,
            narratives_json={"items": narratives},
            timeline_json=timeline,
            alert_sent=False,
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        event_id = event.id

        if quadrant == "crisis":
            create_user_notification(
                db,
                user_id=watch.user_id,
                type="crisis_detected",
                title="Crisis detected",
                message=f'Negative sentiment spiked for "{query}". Review it on Crisis Radar.',
                href="/crisis",
            )
            db.commit()
        elif quadrant == "watch":
            create_user_notification(
                db,
                user_id=watch.user_id,
                type="watch_detected",
                title="Sentiment watch",
                message=f'"{query}" is trending negative. Keep an eye on it in Crisis Radar.',
                href="/crisis",
            )
            db.commit()

        if should_alert and user and user.email:
            alert_sent = send_crisis_alert_email(
                to_email=user.email,
                keyword=query,
                volume_score=volume,
                velocity_score=velocity,
                summary=summary or "",
                narratives=narratives,
            )
            event.alert_sent = alert_sent
            db.commit()

        detail = {
            "watch_id": watch.id,
            "keyword": query,
            "quadrant": quadrant,
            "volume_score": volume,
            "velocity_score": velocity,
            "status_label": QUADRANT_LABELS.get(quadrant, quadrant),
            "status_explanation": QUADRANT_EXPLANATIONS.get(quadrant, ""),
            "mention_count_30m": counts["total"],
            "negative_count_30m": counts["negative"],
            "negative_pct_30m": neg_pct,
            "narratives": narratives,
            "timeline": timeline,
            "recent_events": [],
            "last_scanned_at": now.isoformat(),
        }

    return {
        "watch_id": watch.id,
        "keyword": query,
        "quadrant": quadrant,
        "volume_score": volume,
        "velocity_score": velocity,
        "status_label": QUADRANT_LABELS.get(quadrant, quadrant),
        "status_explanation": QUADRANT_EXPLANATIONS.get(quadrant, ""),
        "mention_count_30m": counts["total"],
        "negative_count_30m": counts["negative"],
        "negative_pct_30m": neg_pct,
        "baseline_negative_30m": baseline_neg,
        "last_scanned_at": now.isoformat(),
        "in_crisis": quadrant == "crisis",
        "event_id": event_id,
        "alert_sent": alert_sent,
        "detail": detail,
    }


def latest_bucket_for_watch(db: Session, watch: SavedSearch) -> PulseBucket | None:
    return (
        db.query(PulseBucket)
        .filter(PulseBucket.saved_search_id == watch.id)
        .order_by(PulseBucket.bucket_start.desc())
        .first()
    )


def radar_point_from_bucket(watch: SavedSearch, bucket: PulseBucket | None) -> dict:
    if bucket is None:
        return {
            "watch_id": watch.id,
            "keyword": watch.query,
            "enabled": watch.alert_enabled,
            "volume_score": 0.0,
            "velocity_score": 0.0,
            "quadrant": "quiet",
            "status_label": "Not scanned yet",
            "status_explanation": "Run a scan to start tracking volume and velocity.",
            "mention_count_30m": 0,
            "negative_count_30m": 0,
            "negative_pct_30m": 0.0,
            "baseline_negative_30m": 0.0,
            "last_scanned_at": None,
            "in_crisis": False,
        }

    neg_pct = (
        round(bucket.negative_count / bucket.mention_count * 100, 1)
        if bucket.mention_count
        else 0.0
    )
    return {
        "watch_id": watch.id,
        "keyword": watch.query,
        "enabled": watch.alert_enabled,
        "volume_score": bucket.volume_score,
        "velocity_score": bucket.velocity_score,
        "quadrant": bucket.quadrant,
        "status_label": QUADRANT_LABELS.get(bucket.quadrant, bucket.quadrant),
        "status_explanation": QUADRANT_EXPLANATIONS.get(bucket.quadrant, ""),
        "mention_count_30m": bucket.mention_count,
        "negative_count_30m": bucket.negative_count,
        "negative_pct_30m": neg_pct,
        "baseline_negative_30m": 0.0,
        "last_scanned_at": bucket.bucket_start.isoformat(),
        "in_crisis": bucket.quadrant == "crisis",
    }


async def scan_all_enabled_watches(db: Session) -> int:
    """Background job: scan every enabled personal alert."""
    watches = (
        db.query(SavedSearch)
        .filter(SavedSearch.alert_enabled.is_(True))
        .all()
    )
    alert_watches = [w for w in watches if w.filters_json and "threshold" in w.filters_json]
    scanned = 0
    for watch in alert_watches:
        user = db.query(User).filter(User.id == watch.user_id).first()
        try:
            await scan_brand_watch(db, watch, user=user, store_event=True)
            scanned += 1
        except Exception as exc:
            logger.error("Pulse scan failed for watch %s: %s", watch.id, exc)
    return scanned
