import json
import re
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.db.models import ChatMessage, ChatSession, Keyword, Mention, SentimentResult
from app.services.analytics_service import get_source_sentiment, get_top_mentions
from app.services.sentiment_service import (
    get_project_sentiment_summary as sentiment_summary,
    get_project_sentiment_trends,
)

STOPWORDS = {
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "must", "shall", "can", "need", "dare",
    "ought", "used", "to", "of", "in", "for", "on", "with", "at", "by",
    "from", "as", "into", "through", "during", "before", "after", "above",
    "below", "between", "under", "again", "further", "then", "once",
    "here", "there", "when", "where", "why", "how", "all", "each", "few",
    "more", "most", "other", "some", "such", "no", "nor", "not", "only",
    "own", "same", "so", "than", "too", "very", "just", "and", "but",
    "if", "or", "because", "until", "while", "about", "against", "what",
    "which", "who", "whom", "this", "that", "these", "those", "am", "i",
    "you", "he", "she", "it", "we", "they", "me", "my", "your", "our",
    "their", "his", "her", "its", "tell", "give", "show", "know", "get",
}

SOURCE_NAMES = {
    "reddit": "Reddit",
    "youtube": "YouTube",
    "gdelt": "GDELT",
    "hackernews": "Hacker News",
    "manual": "Manual",
}


def detect_intent(question: str) -> str:
    q = question.lower()
    if any(
        w in q
        for w in (
            "complaint",
            "complaints",
            "dislike",
            "negative",
            "bad",
            "issue",
            "problem",
            "hate",
            "worst",
            "angry",
            "frustrat",
        )
    ):
        return "complaints"
    if any(
        w in q
        for w in (
            "like",
            "positive",
            "good",
            "love",
            "best",
            "praise",
            "enjoy",
            "favor",
        )
    ):
        return "positive_points"
    if any(w in q for w in ("compare", "comparison", " vs ", " versus ", "reddit vs", "youtube vs")):
        return "comparison"
    if "reddit" in q and ("youtube" in q or "gdelt" in q):
        return "comparison"
    if any(w in q for w in ("trend", "changing", "improving", "worse", "over time", "timeline")):
        return "trend"
    if any(w in q for w in ("top mention", "strongest", "most negative", "most positive")):
        return "top_mentions"
    if "reddit" in q or "youtube" in q or "gdelt" in q or "hackernews" in q:
        return "source_specific"
    if any(
        w in q
        for w in (
            "what are people saying",
            "what do people",
            "summarize",
            "summary",
            "overall",
            "public opinion",
            "opinion",
            "saying about",
        )
    ):
        return "summary"
    if any(w in q for w in ("mostly positive", "mostly negative", "positive or negative")):
        return "summary"
    return "unknown"


def extract_keywords_from_question(
    db: Session, project_id: int, question: str
) -> List[str]:
    keywords = (
        db.query(Keyword).filter(Keyword.project_id == project_id).all()
    )
    q_lower = question.lower()
    matched = [kw.keyword for kw in keywords if kw.keyword.lower() in q_lower]
    if matched:
        return matched

    tokens = re.findall(r"[a-z0-9]+", q_lower)
    important = [t for t in tokens if t not in STOPWORDS and len(t) > 2]
    return important[:5]


def _mention_query(db: Session, project_id: int):
    return (
        db.query(Mention)
        .options(joinedload(Mention.sentiment_result))
        .filter(Mention.project_id == project_id)
    )


def _filter_by_keywords(query, keywords: List[str]):
    if not keywords:
        return query
    clauses = [Mention.text.ilike(f"%{kw}%") for kw in keywords]
    return query.filter(or_(*clauses))


def _mention_to_supporting(m: Mention) -> Dict[str, Any]:
    sr = m.sentiment_result
    return {
        "id": m.id,
        "source": m.source,
        "text": m.text[:500],
        "sentiment_label": sr.sentiment_label if sr else "unknown",
        "sentiment_score": float(sr.sentiment_score) if sr else 0.0,
        "url": m.url,
        "author": m.author,
    }


def get_relevant_mentions(
    db: Session,
    project_id: int,
    question: str,
    intent: str,
    limit: int = 8,
) -> Tuple[List[Mention], List[str]]:
    keywords = extract_keywords_from_question(db, project_id, question)
    q_lower = question.lower()

    query = _mention_query(db, project_id)
    query = query.join(
        SentimentResult, Mention.id == SentimentResult.mention_id
    )

    if intent == "complaints":
        query = query.filter(SentimentResult.sentiment_label == "negative")
        query = query.order_by(SentimentResult.sentiment_score.asc())
    elif intent == "positive_points":
        query = query.filter(SentimentResult.sentiment_label == "positive")
        query = query.order_by(SentimentResult.sentiment_score.desc())
    elif intent == "top_mentions" and "negative" in q_lower:
        query = query.filter(SentimentResult.sentiment_label == "negative")
        query = query.order_by(SentimentResult.sentiment_score.asc())
    elif intent == "top_mentions":
        query = query.order_by(SentimentResult.sentiment_score.desc())
    elif intent == "source_specific":
        for src in ("reddit", "youtube", "gdelt", "hackernews", "manual"):
            if src in q_lower:
                query = query.filter(Mention.source == src)
                break
    else:
        query = query.order_by(SentimentResult.sentiment_score.desc())

    query = _filter_by_keywords(query, keywords)
    mentions = query.limit(limit).all()

    if len(mentions) < 3 and intent in ("summary", "unknown", "comparison", "trend"):
        fallback = (
            _mention_query(db, project_id)
            .join(SentimentResult, Mention.id == SentimentResult.mention_id)
            .order_by(SentimentResult.sentiment_score.desc())
            .limit(limit)
            .all()
        )
        seen = {m.id for m in mentions}
        for m in fallback:
            if m.id not in seen:
                mentions.append(m)
                seen.add(m.id)
            if len(mentions) >= limit:
                break

    sources = sorted({m.source for m in mentions})
    return mentions, sources


def _truncate(text: str, max_len: int = 120) -> str:
    text = text.strip().replace("\n", " ")
    if len(text) <= max_len:
        return text
    return text[: max_len - 3] + "..."


def _themes_from_mentions(mentions: List[Mention], label: str) -> List[str]:
    items = [m for m in mentions if m.sentiment_result and m.sentiment_result.sentiment_label == label]
    themes = []
    for m in items[:4]:
        themes.append(f"- {_truncate(m.text)}")
    return themes


def _format_source_comparison(db: Session, project_id: int) -> str:
    rows = get_source_sentiment(db, project_id)
    lines = ["Source comparison:", ""]
    for row in rows:
        if row["total"] == 0:
            continue
        name = SOURCE_NAMES.get(row["source"], row["source"])
        tone = "neutral"
        if row["positive"] > row["negative"]:
            tone = "more positive discussion"
        elif row["negative"] > row["positive"]:
            tone = "more negative discussion"
        lines.append(f"{name}:")
        lines.append(f"- {row['total']} analyzed mentions ({tone})")
        lines.append(f"- Positive: {row['positive']}, Neutral: {row['neutral']}, Negative: {row['negative']}")
        lines.append("")
    if len(lines) <= 2:
        return "Not enough source-specific data to compare yet."
    return "\n".join(lines).strip()


def _format_trend(db: Session, project_id: int, summary: Dict[str, Any]) -> str:
    trends = get_project_sentiment_trends(db, project_id)
    if not trends:
        return (
            f"Overall sentiment across {summary['total_analyzed']} analyzed mentions: "
            f"{summary['positive']} positive, {summary['neutral']} neutral, "
            f"{summary['negative']} negative (average score {summary['average_score']:+.2f})."
        )
    lines = [
        "Sentiment trend by day:",
        "",
    ]
    for day in trends[-5:]:
        lines.append(
            f"- {day['date']}: +{day['positive']} / ~{day['neutral']} / -{day['negative']} "
            f"(avg {day['average_score']:+.2f})"
        )
    lines.append("")
    lines.append(
        f"Across all analyzed data: {summary['positive']} positive, "
        f"{summary['neutral']} neutral, {summary['negative']} negative."
    )
    return "\n".join(lines)


def generate_answer(db: Session, project_id: int, question: str) -> Dict[str, Any]:
    total_mentions = db.query(Mention).filter(Mention.project_id == project_id).count()
    if total_mentions == 0:
        return {
            "answer": (
                "I do not have any collected mentions for this project yet. "
                "Please collect data from Reddit, YouTube, or GDELT first."
            ),
            "intent": "unknown",
            "sources_used": [],
            "sentiment": {"positive": 0, "neutral": 0, "negative": 0},
            "supporting_mentions": [],
        }

    summary = sentiment_summary(db, project_id)
    if summary["total_analyzed"] == 0:
        return {
            "answer": (
                "I found mentions for this project, but they have not been analyzed yet. "
                "Please click Analyze Sentiment first so I can answer with sentiment insights."
            ),
            "intent": "unknown",
            "sources_used": [],
            "sentiment": {"positive": 0, "neutral": 0, "negative": 0},
            "supporting_mentions": [],
        }

    intent = detect_intent(question)
    if intent == "unknown":
        intent = "summary"

    mentions, sources_used = get_relevant_mentions(db, project_id, question, intent)
    supporting = [_mention_to_supporting(m) for m in mentions[:8]]

    pos_pct = summary["positive_percentage"]
    neg_pct = summary["negative_percentage"]
    overall = "mixed"
    if pos_pct > neg_pct + 10:
        overall = "mostly positive"
    elif neg_pct > pos_pct + 10:
        overall = "mostly negative"
    else:
        overall = "mixed"

    source_list = ", ".join(SOURCE_NAMES.get(s, s) for s in sorted(set(sources_used))) or "your sources"

    if intent == "complaints":
        neg_mentions = [m for m in mentions if m.sentiment_result and m.sentiment_result.sentiment_label == "negative"]
        themes = _themes_from_mentions(neg_mentions or mentions, "negative")
        answer = (
            f"The main negative opinions from {summary['negative']} negative mentions "
            f"(of {summary['total_analyzed']} analyzed) include:\n\n"
            + ("\n".join(themes) if themes else "- General dissatisfaction in collected comments.")
            + f"\n\nMost negative discussion appears across {source_list}."
        )
    elif intent == "positive_points":
        pos_themes = _themes_from_mentions(mentions, "positive")
        answer = (
            f"Users are mostly positive across {summary['positive']} positive mentions:\n\n"
            + ("\n".join(pos_themes) if pos_themes else "- Positive themes in collected feedback.")
            + f"\n\nStrongest positive signals often come from {source_list}."
        )
    elif intent == "comparison":
        answer = _format_source_comparison(db, project_id)
    elif intent == "trend":
        answer = _format_trend(db, project_id, summary)
    elif intent == "top_mentions":
        top = get_top_mentions(db, project_id, limit=3)
        lines = ["Notable mentions from your analyzed data:", ""]
        for item in top["top_negative"][:2]:
            lines.append(f"- [{item['source']}] {item['text'][:200]} (score {item['sentiment_score']:+.2f})")
        for item in top["top_positive"][:2]:
            lines.append(f"- [{item['source']}] {item['text'][:200]} (score {item['sentiment_score']:+.2f})")
        answer = "\n".join(lines)
    else:
        pos_themes = _themes_from_mentions(mentions, "positive")
        neg_themes = _themes_from_mentions(mentions, "negative")
        answer = (
            f"Based on {summary['total_analyzed']} analyzed mentions across {source_list}, "
            f"public opinion is {overall}.\n\n"
            f"Positive themes ({summary['positive']} mentions, {pos_pct:.0f}%):\n"
            + ("\n".join(pos_themes) if pos_themes else "- Some favorable comments in the data.")
            + f"\n\nNegative themes ({summary['negative']} mentions, {neg_pct:.0f}%):\n"
            + ("\n".join(neg_themes) if neg_themes else "- Some concerns in the data.")
            + f"\n\nOverall average sentiment score: {summary['average_score']:+.2f}."
        )

    return {
        "answer": answer.strip(),
        "intent": intent,
        "sources_used": sources_used,
        "sentiment": {
            "positive": summary["positive"],
            "neutral": summary["neutral"],
            "negative": summary["negative"],
        },
        "supporting_mentions": supporting,
    }


def _session_title(question: str) -> str:
    title = question.strip()
    if len(title) > 60:
        return title[:57] + "..."
    return title or "Chat session"


def save_chat_interaction(
    db: Session,
    user_id: int,
    project_id: int,
    session_id: Optional[int],
    question: str,
    answer: Dict[str, Any],
) -> ChatSession:
    if session_id:
        session = (
            db.query(ChatSession)
            .filter(
                ChatSession.id == session_id,
                ChatSession.user_id == user_id,
                ChatSession.project_id == project_id,
            )
            .first()
        )
        if not session:
            raise ValueError("Chat session not found")
    else:
        session = ChatSession(
            user_id=user_id,
            project_id=project_id,
            title=_session_title(question),
        )
        db.add(session)
        db.flush()

    user_msg = ChatMessage(
        session_id=session.id,
        role="user",
        content=question.strip(),
    )
    db.add(user_msg)

    metadata = {
        "sentiment": answer.get("sentiment"),
        "supporting_mentions": answer.get("supporting_mentions"),
    }
    assistant_msg = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=answer["answer"],
        sources_used=json.dumps(answer.get("sources_used", [])),
        intent=answer.get("intent"),
        metadata_json=json.dumps(metadata),
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(session)
    return session


def message_to_response(msg: ChatMessage) -> Dict[str, Any]:
    sources_used = None
    sentiment = None
    supporting = None
    if msg.sources_used:
        try:
            sources_used = json.loads(msg.sources_used)
        except json.JSONDecodeError:
            sources_used = []
    if msg.metadata_json:
        try:
            meta = json.loads(msg.metadata_json)
            sentiment = meta.get("sentiment")
            supporting = meta.get("supporting_mentions")
        except json.JSONDecodeError:
            pass
    return {
        "id": msg.id,
        "session_id": msg.session_id,
        "role": msg.role,
        "content": msg.content,
        "sources_used": sources_used,
        "intent": msg.intent,
        "sentiment": sentiment,
        "supporting_mentions": supporting,
        "created_at": msg.created_at,
    }


def session_to_response(session: ChatSession, include_messages: bool = True) -> Dict[str, Any]:
    data = {
        "id": session.id,
        "user_id": session.user_id,
        "project_id": session.project_id,
        "title": session.title,
        "created_at": session.created_at,
        "messages": [],
    }
    if include_messages:
        messages = (
            db_messages_sorted(session.messages)
            if hasattr(session, "messages")
            else []
        )
        data["messages"] = [message_to_response(m) for m in messages]
    return data


def db_messages_sorted(messages: List[ChatMessage]) -> List[ChatMessage]:
    return sorted(messages, key=lambda m: m.created_at)
