import csv
import json
from datetime import datetime, timezone
from io import StringIO
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session, joinedload

from app.db.models import Keyword, Mention, Project, Report, SentimentResult
from app.services.analytics_service import (
    get_analytics_overview,
    get_source_sentiment,
    get_top_mentions,
)

ALLOWED_REPORT_TYPES = ("daily", "weekly", "monthly", "custom")

SOURCE_NAMES = {
    "reddit": "Reddit",
    "youtube": "YouTube",
    "gdelt": "GDELT",
    "hackernews": "Hacker News",
    "manual": "Manual",
}


def _truncate(text: str, max_len: int = 100) -> str:
    text = (text or "").strip().replace("\n", " ")
    if len(text) <= max_len:
        return text
    return text[: max_len - 3] + "..."


def _extract_themes(mentions: List[Dict[str, Any]], limit: int = 4) -> List[str]:
    themes = []
    for m in mentions[:limit]:
        themes.append(_truncate(m.get("text", ""), 120))
    return themes


def _build_summary_text(
    project_name: str,
    overview: Dict[str, Any],
    source_rows: List[Dict[str, Any]],
    top_positive: List[Dict[str, Any]],
    top_negative: List[Dict[str, Any]],
    keyword_hints: List[str],
) -> str:
    total = overview["total_mentions"]
    analyzed = overview["total_analyzed"]

    if total == 0:
        return (
            f'This report summarizes collected mentions for the project "{project_name}". '
            "No mentions have been collected yet. Use Reddit, YouTube, or GDELT collection "
            "to gather data, then run sentiment analysis before generating a full report."
        )

    if analyzed == 0:
        return (
            f'This report summarizes {total} collected mention(s) for the project "{project_name}". '
            "Mentions exist but none have been analyzed yet. Run Analyze Sentiment to unlock "
            "sentiment breakdowns and exportable insights."
        )

    pos_pct = overview["positive_percentage"]
    neu_pct = overview["neutral_percentage"]
    neg_pct = overview["negative_percentage"]

    tone = "mixed"
    if pos_pct > neg_pct + 10:
        tone = "mostly positive"
    elif neg_pct > pos_pct + 10:
        tone = "mostly negative"

    lines = [
        f'This report summarizes {total} collected mentions for the project "{project_name}".',
        "",
        f"Out of {analyzed} analyzed mentions, sentiment is {tone}. "
        f"Positive mentions represent {pos_pct:.0f}%, neutral mentions represent {neu_pct:.0f}%, "
        f"and negative mentions represent {neg_pct:.0f}%. "
        f"Average sentiment score is {overview['average_score']:+.2f}.",
        "",
    ]

    if top_positive:
        lines.append(
            "The strongest positive discussions highlight "
            + ", ".join(_extract_themes(top_positive, 3)[:3])
            + "."
        )
    if top_negative:
        lines.append(
            "The strongest negative discussions mention "
            + ", ".join(_extract_themes(top_negative, 3)[:3])
            + "."
        )

    active_sources = [r for r in source_rows if r["total"] > 0]
    if active_sources:
        by_count = max(active_sources, key=lambda r: r["total"])
        by_positive = max(active_sources, key=lambda r: r["positive"])
        lines.append("")
        lines.append(
            f"{SOURCE_NAMES.get(by_count['source'], by_count['source'])} generated the highest "
            f"number of mentions ({by_count['total']}), while "
            f"{SOURCE_NAMES.get(by_positive['source'], by_positive['source'])} showed "
            f"the strongest positive engagement ({by_positive['positive']} positive)."
        )
        neutral_heavy = [r for r in active_sources if r["neutral"] >= r["positive"] and r["neutral"] >= r["negative"]]
        if neutral_heavy:
            src = neutral_heavy[0]["source"]
            lines.append(
                f"{SOURCE_NAMES.get(src, src)} coverage was mostly neutral."
            )

    if keyword_hints:
        lines.append("")
        lines.append(f"Tracked keywords: {', '.join(keyword_hints)}.")

    return "\n".join(lines).strip()


def generate_project_report(
    db: Session,
    project_id: int,
    report_type: str = "custom",
) -> Dict[str, Any]:
    if report_type not in ALLOWED_REPORT_TYPES:
        report_type = "custom"

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise ValueError("Project not found")

    overview_data = get_analytics_overview(db, project_id)
    source_rows = get_source_sentiment(db, project_id)
    top_data = get_top_mentions(db, project_id, limit=5)

    keywords = (
        db.query(Keyword.keyword)
        .filter(Keyword.project_id == project_id)
        .limit(10)
        .all()
    )
    keyword_hints = [k[0] for k in keywords]

    overview = {
        "total_mentions": overview_data["total_mentions"],
        "total_analyzed": overview_data["total_analyzed"],
        "positive": overview_data["positive"],
        "neutral": overview_data["neutral"],
        "negative": overview_data["negative"],
        "positive_percentage": overview_data["positive_percentage"],
        "neutral_percentage": overview_data["neutral_percentage"],
        "negative_percentage": overview_data["negative_percentage"],
        "average_score": overview_data["average_score"],
        "keyword_count": overview_data["keyword_count"],
    }

    summary = _build_summary_text(
        project.name,
        overview,
        source_rows,
        top_data["top_positive"],
        top_data["top_negative"],
        keyword_hints,
    )

    payload = {
        "project_id": project_id,
        "project_name": project.name,
        "report_type": report_type,
        "summary": summary,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "overview": overview,
        "source_breakdown": source_rows,
        "top_positive": top_data["top_positive"],
        "top_negative": top_data["top_negative"],
        "keyword_hints": keyword_hints,
        "themes_positive": _extract_themes(top_data["top_positive"]),
        "themes_negative": _extract_themes(top_data["top_negative"]),
    }

    report = Report(
        project_id=project_id,
        report_type=report_type,
        summary=summary,
        report_json=json.dumps(payload),
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return _report_detail_from_model(report, project.name, payload)


def _report_detail_from_model(
    report: Report,
    project_name: str,
    payload: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    if payload is None and report.report_json:
        try:
            payload = json.loads(report.report_json)
        except json.JSONDecodeError:
            payload = {}

    payload = payload or {}
    return {
        "id": report.id,
        "project_id": report.project_id,
        "project_name": payload.get("project_name", project_name),
        "report_type": report.report_type,
        "summary": report.summary,
        "generated_at": report.generated_at,
        "overview": payload.get("overview", {}),
        "source_breakdown": payload.get("source_breakdown", []),
        "top_positive": payload.get("top_positive", []),
        "top_negative": payload.get("top_negative", []),
        "keyword_hints": payload.get("keyword_hints", []),
        "themes_positive": payload.get("themes_positive", []),
        "themes_negative": payload.get("themes_negative", []),
    }


def list_project_reports(db: Session, project_id: int) -> List[Dict[str, Any]]:
    reports = (
        db.query(Report)
        .filter(Report.project_id == project_id)
        .order_by(Report.generated_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "project_id": r.project_id,
            "report_type": r.report_type,
            "summary": _truncate(r.summary, 200),
            "generated_at": r.generated_at,
        }
        for r in reports
    ]


def get_project_report(db: Session, report_id: int) -> Optional[Dict[str, Any]]:
    report = (
        db.query(Report)
        .options(joinedload(Report.project))
        .filter(Report.id == report_id)
        .first()
    )
    if not report:
        return None
    project_name = report.project.name if report.project else ""
    return _report_detail_from_model(report, project_name)


def delete_project_report(db: Session, report_id: int) -> bool:
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        return False
    db.delete(report)
    db.commit()
    return True


def _format_dt(value: Optional[datetime]) -> str:
    if value is None:
        return ""
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def build_mentions_csv(db: Session, project_id: int) -> str:
    mentions = (
        db.query(Mention)
        .filter(Mention.project_id == project_id)
        .order_by(Mention.id.asc())
        .all()
    )
    output = StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
    writer.writerow(
        [
            "id",
            "source",
            "author",
            "text",
            "url",
            "published_at",
            "engagement_score",
            "created_at",
        ]
    )
    for m in mentions:
        writer.writerow(
            [
                m.id,
                m.source,
                m.author or "",
                m.text,
                m.url or "",
                _format_dt(m.published_at),
                m.engagement_score,
                _format_dt(m.created_at),
            ]
        )
    return output.getvalue()


def build_sentiment_csv(db: Session, project_id: int) -> str:
    rows = (
        db.query(Mention, SentimentResult)
        .join(SentimentResult, Mention.id == SentimentResult.mention_id)
        .filter(Mention.project_id == project_id)
        .order_by(Mention.id.asc())
        .all()
    )
    output = StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
    writer.writerow(
        [
            "mention_id",
            "source",
            "author",
            "text",
            "url",
            "published_at",
            "engagement_score",
            "sentiment_label",
            "sentiment_score",
            "confidence",
            "model_name",
            "analyzed_at",
        ]
    )
    for mention, sr in rows:
        writer.writerow(
            [
                mention.id,
                mention.source,
                mention.author or "",
                mention.text,
                mention.url or "",
                _format_dt(mention.published_at),
                mention.engagement_score,
                sr.sentiment_label,
                sr.sentiment_score,
                sr.confidence,
                sr.model_name,
                _format_dt(sr.analyzed_at),
            ]
        )
    return output.getvalue()
