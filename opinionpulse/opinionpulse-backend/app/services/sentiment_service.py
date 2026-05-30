import re
from collections import defaultdict
from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

from app.db.models import Mention, SentimentResult

_analyzer = SentimentIntensityAnalyzer()

POSITIVE_THRESHOLD = 0.05
NEGATIVE_THRESHOLD = -0.05


def clean_text(text: str) -> str:
    """Strip whitespace and collapse extra spaces; preserve sentiment cues."""
    text = text.strip()
    return re.sub(r"\s+", " ", text)


def analyze_text_sentiment(text: str) -> Dict[str, Any]:
    """Analyze text with VADER compound score."""
    scores = _analyzer.polarity_scores(text)
    compound = float(scores["compound"])

    if compound >= POSITIVE_THRESHOLD:
        label = "positive"
    elif compound <= NEGATIVE_THRESHOLD:
        label = "negative"
    else:
        label = "neutral"

    confidence = abs(compound)
    return {
        "sentiment_label": label,
        "sentiment_score": round(compound, 4),
        "confidence": round(confidence, 4),
        "model_name": "vader",
    }


def _upsert_sentiment_result(
    db: Session, mention: Mention, analysis: Dict[str, Any]
) -> SentimentResult:
    if mention.sentiment_result is not None:
        sr = mention.sentiment_result
        sr.sentiment_label = analysis["sentiment_label"]
        sr.sentiment_score = analysis["sentiment_score"]
        sr.confidence = analysis["confidence"]
        sr.model_name = analysis["model_name"]
        sr.analyzed_at = datetime.now(timezone.utc)
    else:
        sr = SentimentResult(
            mention_id=mention.id,
            sentiment_label=analysis["sentiment_label"],
            sentiment_score=analysis["sentiment_score"],
            confidence=analysis["confidence"],
            model_name=analysis["model_name"],
        )
        db.add(sr)
    return sr


def analyze_mention(db: Session, mention: Mention, *, commit: bool = True) -> SentimentResult:
    """Clean mention text, analyze with VADER, save or update SentimentResult."""
    cleaned = clean_text(mention.text)
    mention.cleaned_text = cleaned
    analysis = analyze_text_sentiment(cleaned)
    result = _upsert_sentiment_result(db, mention, analysis)
    if commit:
        db.commit()
        db.refresh(mention)
        db.refresh(result)
    return result


def analyze_project_mentions(db: Session, project_id: int) -> Dict[str, int]:
    """Analyze all mentions in a project; update existing sentiment rows."""
    mentions = db.query(Mention).filter(Mention.project_id == project_id).all()
    if not mentions:
        return {"analyzed": 0, "positive": 0, "neutral": 0, "negative": 0}

    positive = neutral = negative = 0
    for mention in mentions:
        result = analyze_mention(db, mention, commit=False)
        if result.sentiment_label == "positive":
            positive += 1
        elif result.sentiment_label == "negative":
            negative += 1
        else:
            neutral += 1

    db.commit()
    return {
        "analyzed": len(mentions),
        "positive": positive,
        "neutral": neutral,
        "negative": negative,
    }


def get_project_sentiment_summary(db: Session, project_id: int) -> Dict[str, Any]:
    """Aggregate sentiment counts and average score for a project."""
    rows = (
        db.query(SentimentResult)
        .join(Mention, SentimentResult.mention_id == Mention.id)
        .filter(Mention.project_id == project_id)
        .all()
    )

    total = len(rows)
    if total == 0:
        return {
            "total_analyzed": 0,
            "positive": 0,
            "neutral": 0,
            "negative": 0,
            "positive_percentage": 0.0,
            "neutral_percentage": 0.0,
            "negative_percentage": 0.0,
            "average_score": 0.0,
        }

    positive = sum(1 for r in rows if r.sentiment_label == "positive")
    neutral = sum(1 for r in rows if r.sentiment_label == "neutral")
    negative = sum(1 for r in rows if r.sentiment_label == "negative")
    scores = [r.sentiment_score for r in rows if r.sentiment_score is not None]
    average = sum(scores) / len(scores) if scores else 0.0

    def pct(count: int) -> float:
        return round((count / total) * 100, 2)

    return {
        "total_analyzed": total,
        "positive": positive,
        "neutral": neutral,
        "negative": negative,
        "positive_percentage": pct(positive),
        "neutral_percentage": pct(neutral),
        "negative_percentage": pct(negative),
        "average_score": round(average, 4),
    }


def _mention_group_date(mention: Mention) -> date:
    dt: Optional[datetime] = mention.published_at or mention.created_at
    if dt is None:
        return date.today()
    if hasattr(dt, "date"):
        return dt.date()
    return dt


def get_project_sentiment_trends(db: Session, project_id: int) -> List[Dict[str, Any]]:
    """Daily aggregated sentiment counts and average score."""
    rows = (
        db.query(SentimentResult, Mention)
        .join(Mention, SentimentResult.mention_id == Mention.id)
        .filter(Mention.project_id == project_id)
        .all()
    )

    buckets: Dict[str, Dict[str, Any]] = defaultdict(
        lambda: {
            "positive": 0,
            "neutral": 0,
            "negative": 0,
            "scores": [],
        }
    )

    for result, mention in rows:
        day_key = _mention_group_date(mention).isoformat()
        bucket = buckets[day_key]
        label = result.sentiment_label
        if label == "positive":
            bucket["positive"] += 1
        elif label == "negative":
            bucket["negative"] += 1
        else:
            bucket["neutral"] += 1
        if result.sentiment_score is not None:
            bucket["scores"].append(result.sentiment_score)

    trends: List[Dict[str, Any]] = []
    for day_key in sorted(buckets.keys()):
        bucket = buckets[day_key]
        scores = bucket["scores"]
        avg = round(sum(scores) / len(scores), 4) if scores else 0.0
        trends.append(
            {
                "date": day_key,
                "positive": bucket["positive"],
                "neutral": bucket["neutral"],
                "negative": bucket["negative"],
                "average_score": avg,
            }
        )
    return trends
