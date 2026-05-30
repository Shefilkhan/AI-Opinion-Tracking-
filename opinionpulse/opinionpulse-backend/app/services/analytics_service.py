from typing import Any, Dict, List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.models import Keyword, Mention, SentimentResult
from app.schemas.mention import ALLOWED_SOURCES
from app.services.sentiment_service import get_project_sentiment_summary

ALLOWED_SENTIMENT_FILTERS = ("positive", "neutral", "negative", "unanalyzed")


def get_analytics_overview(db: Session, project_id: int) -> Dict[str, Any]:
    total_mentions = (
        db.query(Mention).filter(Mention.project_id == project_id).count()
    )
    keyword_count = (
        db.query(Keyword).filter(Keyword.project_id == project_id).count()
    )
    summary = get_project_sentiment_summary(db, project_id)

    top_source_row = (
        db.query(Mention.source, func.count(Mention.id).label("cnt"))
        .filter(Mention.project_id == project_id)
        .group_by(Mention.source)
        .order_by(func.count(Mention.id).desc())
        .first()
    )
    top_source = top_source_row[0] if top_source_row and top_source_row[1] > 0 else None

    top_sentiment = None
    if summary["total_analyzed"] > 0:
        counts = {
            "positive": summary["positive"],
            "neutral": summary["neutral"],
            "negative": summary["negative"],
        }
        top_sentiment = max(counts, key=counts.get)

    return {
        "total_mentions": total_mentions,
        "total_analyzed": summary["total_analyzed"],
        "positive": summary["positive"],
        "neutral": summary["neutral"],
        "negative": summary["negative"],
        "positive_percentage": summary["positive_percentage"],
        "neutral_percentage": summary["neutral_percentage"],
        "negative_percentage": summary["negative_percentage"],
        "average_score": summary["average_score"],
        "top_source": top_source,
        "top_sentiment": top_sentiment,
        "keyword_count": keyword_count,
    }


def get_source_sentiment(db: Session, project_id: int) -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []

    for source in ALLOWED_SOURCES:
        total = (
            db.query(Mention)
            .filter(Mention.project_id == project_id, Mention.source == source)
            .count()
        )
        positive = (
            db.query(Mention)
            .join(SentimentResult, Mention.id == SentimentResult.mention_id)
            .filter(
                Mention.project_id == project_id,
                Mention.source == source,
                SentimentResult.sentiment_label == "positive",
            )
            .count()
        )
        neutral = (
            db.query(Mention)
            .join(SentimentResult, Mention.id == SentimentResult.mention_id)
            .filter(
                Mention.project_id == project_id,
                Mention.source == source,
                SentimentResult.sentiment_label == "neutral",
            )
            .count()
        )
        negative = (
            db.query(Mention)
            .join(SentimentResult, Mention.id == SentimentResult.mention_id)
            .filter(
                Mention.project_id == project_id,
                Mention.source == source,
                SentimentResult.sentiment_label == "negative",
            )
            .count()
        )
        avg_row = (
            db.query(func.avg(SentimentResult.sentiment_score))
            .join(Mention, SentimentResult.mention_id == Mention.id)
            .filter(Mention.project_id == project_id, Mention.source == source)
            .scalar()
        )
        average_score = round(float(avg_row), 4) if avg_row is not None else 0.0

        results.append(
            {
                "source": source,
                "total": total,
                "positive": positive,
                "neutral": neutral,
                "negative": negative,
                "average_score": average_score,
            }
        )

    return results


def get_sentiment_distribution(db: Session, project_id: int) -> List[Dict[str, Any]]:
    summary = get_project_sentiment_summary(db, project_id)
    total = summary["total_analyzed"]
    if total == 0:
        return [
            {"label": "positive", "count": 0, "percentage": 0.0},
            {"label": "neutral", "count": 0, "percentage": 0.0},
            {"label": "negative", "count": 0, "percentage": 0.0},
        ]

    return [
        {
            "label": "positive",
            "count": summary["positive"],
            "percentage": summary["positive_percentage"],
        },
        {
            "label": "neutral",
            "count": summary["neutral"],
            "percentage": summary["neutral_percentage"],
        },
        {
            "label": "negative",
            "count": summary["negative"],
            "percentage": summary["negative_percentage"],
        },
    ]


def _mention_to_top_item(mention: Mention) -> Dict[str, Any]:
    sr = mention.sentiment_result
    return {
        "id": mention.id,
        "source": mention.source,
        "author": mention.author,
        "text": mention.text,
        "sentiment_label": sr.sentiment_label,
        "sentiment_score": sr.sentiment_score,
        "confidence": sr.confidence,
        "url": mention.url,
    }


def get_top_mentions(
    db: Session, project_id: int, limit: int = 5
) -> Dict[str, List[Dict[str, Any]]]:
    from sqlalchemy.orm import joinedload

    top_positive = (
        db.query(Mention)
        .options(joinedload(Mention.sentiment_result))
        .join(SentimentResult, Mention.id == SentimentResult.mention_id)
        .filter(
            Mention.project_id == project_id,
            SentimentResult.sentiment_label == "positive",
        )
        .order_by(SentimentResult.sentiment_score.desc())
        .limit(limit)
        .all()
    )

    top_negative = (
        db.query(Mention)
        .options(joinedload(Mention.sentiment_result))
        .join(SentimentResult, Mention.id == SentimentResult.mention_id)
        .filter(
            Mention.project_id == project_id,
            SentimentResult.sentiment_label == "negative",
        )
        .order_by(SentimentResult.sentiment_score.asc())
        .limit(limit)
        .all()
    )

    return {
        "top_positive": [_mention_to_top_item(m) for m in top_positive],
        "top_negative": [_mention_to_top_item(m) for m in top_negative],
    }
