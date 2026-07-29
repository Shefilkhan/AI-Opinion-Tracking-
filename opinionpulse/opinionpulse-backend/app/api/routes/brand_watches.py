"""Brand & reputation watchlist API."""

from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.db.models import SavedSearch, User
from app.schemas.brand_watch import (
    AlertPreferencesOut,
    AlertPreferencesUpdate,
    BrandWatchCreate,
    BrandWatchOut,
    BrandWatchUpdate,
    ResponseBriefOut,
)
from app.services.alert_preferences_service import get_or_create_preferences, prefs_to_dict
from app.services.brand_report_service import build_weekly_report_html
from app.services.brand_watch_service import (
    build_search_terms,
    fetch_bundle_results,
    parse_watch_meta,
    row_to_watch_out,
    watch_display_name,
)
from app.services.notification_service import create_user_notification
from app.services.plan_limits import check_keyword_alert_limit
from app.services.response_brief_service import generate_response_brief

router = APIRouter(prefix="/api/brand-watches", tags=["brand-watches"])


def _get_watch(watch_id: str, user: User, db: Session) -> SavedSearch:
    row = (
        db.query(SavedSearch)
        .filter(SavedSearch.id == watch_id, SavedSearch.user_id == user.id)
        .first()
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Watch not found")
    meta = parse_watch_meta(row)
    if "threshold" not in meta:
        raise HTTPException(status_code=404, detail="Watch not found")
    return row


def _alert_rows(db: Session, user_id: int) -> list[SavedSearch]:
    rows = (
        db.query(SavedSearch)
        .filter(SavedSearch.user_id == user_id, SavedSearch.alert_enabled.isnot(None))
        .order_by(SavedSearch.created_at.desc())
        .all()
    )
    result: list[SavedSearch] = []
    for r in rows:
        try:
            meta = json.loads(r.filters_json or "{}")
            if "threshold" in meta:
                result.append(r)
        except Exception:
            continue
    return result


@router.get("/alert-preferences", response_model=AlertPreferencesOut)
def get_alert_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prefs = get_or_create_preferences(db, current_user.id)
    return AlertPreferencesOut(**prefs_to_dict(prefs))


@router.patch("/alert-preferences", response_model=AlertPreferencesOut)
def update_alert_preferences(
    body: AlertPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prefs = get_or_create_preferences(db, current_user.id)
    if body.email_crisis is not None:
        prefs.email_crisis = body.email_crisis
    if body.email_weekly_report is not None:
        prefs.email_weekly_report = body.email_weekly_report
    if body.slack_crisis is not None:
        prefs.slack_crisis = body.slack_crisis
    if body.slack_webhook_url is not None:
        url = body.slack_webhook_url.strip()
        prefs.slack_webhook_url = url if url else None
    db.commit()
    db.refresh(prefs)
    return AlertPreferencesOut(**prefs_to_dict(prefs))


@router.get("", response_model=list[BrandWatchOut])
def list_brand_watches(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return [BrandWatchOut(**row_to_watch_out(r)) for r in _alert_rows(db, current_user.id)]


@router.post("", response_model=BrandWatchOut, status_code=status.HTTP_201_CREATED)
def create_brand_watch(
    body: BrandWatchCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    check_keyword_alert_limit(current_user.id, db)

    aliases = [a.strip() for a in body.aliases if a.strip()][:10]
    terms = build_search_terms(
        {
            "brand": body.brand,
            "product": body.product,
            "ceo": body.ceo,
            "aliases": aliases,
        },
        body.brand,
    )
    meta = {
        "watch_type": "bundle",
        "name": body.name.strip(),
        "brand": body.brand.strip(),
        "product": (body.product or "").strip() or None,
        "ceo": (body.ceo or "").strip() or None,
        "aliases": aliases,
        "terms": terms,
        "threshold": body.threshold,
        "frequency": body.frequency,
    }
    row = SavedSearch(
        user_id=current_user.id,
        query=body.brand.strip(),
        filters_json=json.dumps(meta),
        alert_enabled=True,
    )
    db.add(row)
    create_user_notification(
        db,
        user_id=current_user.id,
        type="alert_created",
        title="Brand watch created",
        message=f'"{body.name}" is now monitored across {len(terms)} search terms.',
        href="/alerts",
    )
    db.commit()
    db.refresh(row)
    return BrandWatchOut(**row_to_watch_out(row))


@router.patch("/{watch_id}", response_model=BrandWatchOut)
def update_brand_watch(
    watch_id: str,
    body: BrandWatchUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = _get_watch(watch_id, current_user, db)
    meta = parse_watch_meta(row)

    if body.enabled is not None:
        if body.enabled and not row.alert_enabled:
            check_keyword_alert_limit(current_user.id, db)
        row.alert_enabled = body.enabled
    if body.name is not None:
        meta["name"] = body.name.strip()
    if body.brand is not None:
        meta["brand"] = body.brand.strip()
        row.query = body.brand.strip()
    if body.product is not None:
        meta["product"] = body.product.strip() or None
    if body.ceo is not None:
        meta["ceo"] = body.ceo.strip() or None
    if body.aliases is not None:
        meta["aliases"] = [a.strip() for a in body.aliases if a.strip()][:10]
    if body.threshold is not None:
        meta["threshold"] = body.threshold
    if body.frequency is not None:
        meta["frequency"] = body.frequency

    meta["terms"] = build_search_terms(meta, row.query)
    meta["watch_type"] = "bundle" if len(meta["terms"]) > 1 else "single"
    row.filters_json = json.dumps(meta)
    db.commit()
    db.refresh(row)
    return BrandWatchOut(**row_to_watch_out(row))


@router.delete("/{watch_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_brand_watch(
    watch_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = _get_watch(watch_id, current_user, db)
    db.delete(row)
    db.commit()
    return None


@router.post("/{watch_id}/response-brief", response_model=ResponseBriefOut)
async def get_response_brief(
    watch_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = _get_watch(watch_id, current_user, db)
    meta = parse_watch_meta(row)
    name = watch_display_name(row, meta)
    terms = build_search_terms(meta, row.query)
    results = await fetch_bundle_results(terms, time_range="7d")
    brief = await generate_response_brief(name, results)
    return ResponseBriefOut(**brief)


@router.get("/{watch_id}/weekly-report")
def download_weekly_report(
    watch_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = _get_watch(watch_id, current_user, db)
    meta = parse_watch_meta(row)
    name = watch_display_name(row, meta)
    html = build_weekly_report_html(db, user=current_user, watch=row, days=7)
    safe_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in name)[:40]
    return HTMLResponse(
        content=html,
        headers={
            "Content-Disposition": f'inline; filename="weekly-report-{safe_name}.html"'
        },
    )
