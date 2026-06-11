"""Personal (user-level) keyword alerts — no project required.

Alerts are stored in the `saved_searches` table with `alert_enabled=True`.
The `filters_json` column carries the threshold and frequency metadata.
"""
from __future__ import annotations

import json
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.db.models import SavedSearch, User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/personal-alerts", tags=["personal-alerts"])


# ─── schemas ─────────────────────────────────────────────────────────────────

class PersonalAlertCreate(BaseModel):
    keyword: str
    threshold: int = 70          # % negative sentiment
    frequency: str = "daily"     # "instant" | "daily"


class PersonalAlertUpdate(BaseModel):
    enabled: Optional[bool] = None
    threshold: Optional[int] = None
    frequency: Optional[str] = None


class PersonalAlertOut(BaseModel):
    id: str
    keyword: str
    threshold: int
    frequency: str
    enabled: bool


# ─── helpers ─────────────────────────────────────────────────────────────────

def _row_to_out(row: SavedSearch) -> PersonalAlertOut:
    meta: dict = {}
    if row.filters_json:
        try:
            meta = json.loads(row.filters_json)
        except Exception:
            pass
    return PersonalAlertOut(
        id=row.id,
        keyword=row.query,
        threshold=meta.get("threshold", 70),
        frequency=meta.get("frequency", "daily"),
        enabled=row.alert_enabled,
    )


def _get_alert(alert_id: str, user: User, db: Session) -> SavedSearch:
    row = (
        db.query(SavedSearch)
        .filter(
            SavedSearch.id == alert_id,
            SavedSearch.user_id == user.id,
            SavedSearch.alert_enabled.isnot(None),  # only alert rows
        )
        .first()
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    return row


# ─── endpoints ───────────────────────────────────────────────────────────────

@router.get("", response_model=list[PersonalAlertOut])
def list_personal_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(SavedSearch)
        .filter(
            SavedSearch.user_id == current_user.id,
            SavedSearch.alert_enabled.isnot(None),
        )
        .order_by(SavedSearch.created_at.desc())
        .all()
    )
    # Only return rows that are tagged as alerts (filters_json has 'threshold')
    alert_rows = [r for r in rows if r.filters_json and "threshold" in r.filters_json]
    return [_row_to_out(r) for r in alert_rows]


@router.post("", response_model=PersonalAlertOut, status_code=status.HTTP_201_CREATED)
def create_personal_alert(
    body: PersonalAlertCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    keyword = body.keyword.strip()
    if not keyword:
        raise HTTPException(status_code=400, detail="Keyword is required")

    meta = {"threshold": body.threshold, "frequency": body.frequency}
    row = SavedSearch(
        user_id=current_user.id,
        query=keyword,
        filters_json=json.dumps(meta),
        alert_enabled=True,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    logger.info("Created personal alert %s for user %s (keyword=%r)", row.id, current_user.id, keyword)
    return _row_to_out(row)


@router.patch("/{alert_id}", response_model=PersonalAlertOut)
def update_personal_alert(
    alert_id: str,
    body: PersonalAlertUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = _get_alert(alert_id, current_user, db)
    meta: dict = {}
    if row.filters_json:
        try:
            meta = json.loads(row.filters_json)
        except Exception:
            pass

    if body.enabled is not None:
        row.alert_enabled = body.enabled
    if body.threshold is not None:
        meta["threshold"] = body.threshold
    if body.frequency is not None:
        meta["frequency"] = body.frequency

    row.filters_json = json.dumps(meta)
    db.commit()
    db.refresh(row)
    return _row_to_out(row)


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_personal_alert(
    alert_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = _get_alert(alert_id, current_user, db)
    db.delete(row)
    db.commit()
    return None
