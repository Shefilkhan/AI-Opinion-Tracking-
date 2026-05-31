from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.db.models import Alert, Mention
from app.schemas.mention import ALLOWED_SOURCES
from app.services.sentiment_service import get_project_sentiment_summary

ALLOWED_ALERT_TYPES = (
    "negative_sentiment",
    "high_volume",
    "keyword_mention",
    "source_volume",
)


def _build_condition_text(
    alert_type: str,
    threshold_value: float,
    keyword: Optional[str] = None,
    source: Optional[str] = None,
) -> str:
    if alert_type == "negative_sentiment":
        return f"Negative sentiment percentage >= {threshold_value:g}%"
    if alert_type == "high_volume":
        return f"Total mentions >= {int(threshold_value)}"
    if alert_type == "keyword_mention":
        kw = (keyword or "").strip()
        return f'Mentions containing "{kw}" >= {int(threshold_value)}'
    if alert_type == "source_volume":
        src = source or "source"
        return f"{src} mentions >= {int(threshold_value)}"
    return f"Threshold >= {threshold_value:g}"


def _validate_create_data(data: Dict[str, Any]) -> None:
    alert_type = data.get("alert_type")
    if alert_type not in ALLOWED_ALERT_TYPES:
        raise ValueError(f"Invalid alert type: {alert_type}")

    threshold = data.get("threshold_value")
    if threshold is None or threshold <= 0:
        raise ValueError("Threshold must be greater than 0")

    if alert_type == "negative_sentiment" and threshold > 100:
        raise ValueError("Negative sentiment threshold cannot exceed 100%")

    if alert_type == "keyword_mention":
        keyword = (data.get("keyword") or "").strip()
        if not keyword:
            raise ValueError("Keyword is required for keyword mention alerts")

    if alert_type == "source_volume":
        source = (data.get("source") or "").strip().lower()
        if source not in ALLOWED_SOURCES:
            raise ValueError(
                f"Source must be one of: {', '.join(ALLOWED_SOURCES)}"
            )
        data["source"] = source


def create_alert(db: Session, project_id: int, data: Dict[str, Any]) -> Alert:
    _validate_create_data(data)
    condition_text = _build_condition_text(
        data["alert_type"],
        data["threshold_value"],
        data.get("keyword"),
        data.get("source"),
    )
    alert = Alert(
        project_id=project_id,
        alert_type=data["alert_type"],
        condition_text=condition_text,
        threshold_value=float(data["threshold_value"]),
        keyword=(data.get("keyword") or "").strip() or None,
        source=(data.get("source") or "").strip().lower() or None,
        is_active=data.get("is_active", True),
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


def list_project_alerts(db: Session, project_id: int) -> List[Alert]:
    return (
        db.query(Alert)
        .filter(Alert.project_id == project_id)
        .order_by(Alert.created_at.desc())
        .all()
    )


def update_alert(db: Session, alert: Alert, data: Dict[str, Any]) -> Alert:
    if data.get("threshold_value") is not None:
        threshold = float(data["threshold_value"])
        if threshold <= 0:
            raise ValueError("Threshold must be greater than 0")
        if alert.alert_type == "negative_sentiment" and threshold > 100:
            raise ValueError("Negative sentiment threshold cannot exceed 100%")
        alert.threshold_value = threshold

    if data.get("keyword") is not None:
        alert.keyword = data["keyword"].strip() or None

    if data.get("source") is not None:
        source = data["source"].strip().lower()
        if alert.alert_type == "source_volume" and source not in ALLOWED_SOURCES:
            raise ValueError(
                f"Source must be one of: {', '.join(ALLOWED_SOURCES)}"
            )
        alert.source = source or None

    if data.get("is_active") is not None:
        alert.is_active = bool(data["is_active"])

    alert.condition_text = _build_condition_text(
        alert.alert_type,
        alert.threshold_value,
        alert.keyword,
        alert.source,
    )
    db.commit()
    db.refresh(alert)
    return alert


def delete_alert(db: Session, alert: Alert) -> None:
    db.delete(alert)
    db.commit()


def evaluate_single_alert(db: Session, alert: Alert) -> Dict[str, Any]:
    if not alert.is_active:
        return {
            "alert_id": alert.id,
            "alert_type": alert.alert_type,
            "triggered": False,
            "message": "Alert is inactive and was skipped.",
            "is_active": False,
        }

    project_id = alert.project_id
    threshold = alert.threshold_value

    if alert.alert_type == "negative_sentiment":
        summary = get_project_sentiment_summary(db, project_id)
        if summary["total_analyzed"] == 0:
            return {
                "alert_id": alert.id,
                "alert_type": alert.alert_type,
                "triggered": False,
                "message": (
                    "No analyzed mentions yet. Run sentiment analysis first."
                ),
                "is_active": True,
            }
        neg_pct = summary["negative_percentage"]
        triggered = neg_pct >= threshold
        msg = (
            f"Negative sentiment is {neg_pct:.1f}%, "
            f"{'above' if triggered else 'below'} your {threshold:g}% threshold."
        )

    elif alert.alert_type == "high_volume":
        total = (
            db.query(Mention).filter(Mention.project_id == project_id).count()
        )
        triggered = total >= threshold
        msg = (
            f"Total mentions are {total}, "
            f"{'above' if triggered else 'below'} your {int(threshold)} threshold."
        )

    elif alert.alert_type == "keyword_mention":
        keyword = (alert.keyword or "").strip()
        if not keyword:
            return {
                "alert_id": alert.id,
                "alert_type": alert.alert_type,
                "triggered": False,
                "message": "Keyword is not configured for this alert.",
                "is_active": True,
            }
        count = (
            db.query(Mention)
            .filter(
                Mention.project_id == project_id,
                Mention.text.ilike(f"%{keyword}%"),
            )
            .count()
        )
        triggered = count >= threshold
        msg = (
            f'Keyword "{keyword}" appeared in {count} mention(s), '
            f"{'above' if triggered else 'below'} your {int(threshold)} threshold."
        )

    elif alert.alert_type == "source_volume":
        source = (alert.source or "").strip().lower()
        if not source:
            return {
                "alert_id": alert.id,
                "alert_type": alert.alert_type,
                "triggered": False,
                "message": "Source is not configured for this alert.",
                "is_active": True,
            }
        count = (
            db.query(Mention)
            .filter(
                Mention.project_id == project_id,
                Mention.source == source,
            )
            .count()
        )
        triggered = count >= threshold
        msg = (
            f"{source.capitalize()} has {count} mention(s), "
            f"{'above' if triggered else 'below'} your {int(threshold)} threshold."
        )

    else:
        return {
            "alert_id": alert.id,
            "alert_type": alert.alert_type,
            "triggered": False,
            "message": f"Unknown alert type: {alert.alert_type}",
            "is_active": True,
        }

    if triggered:
        alert.last_triggered_at = datetime.now(timezone.utc)
        db.commit()

    return {
        "alert_id": alert.id,
        "alert_type": alert.alert_type,
        "triggered": triggered,
        "message": msg,
        "is_active": True,
    }


def evaluate_project_alerts(db: Session, project_id: int) -> Dict[str, Any]:
    alerts = list_project_alerts(db, project_id)
    active_alerts = [a for a in alerts if a.is_active]
    results = [evaluate_single_alert(db, a) for a in active_alerts]
    triggered_count = sum(1 for r in results if r["triggered"])

    return {
        "project_id": project_id,
        "evaluated": len(active_alerts),
        "triggered": triggered_count,
        "results": results,
    }
