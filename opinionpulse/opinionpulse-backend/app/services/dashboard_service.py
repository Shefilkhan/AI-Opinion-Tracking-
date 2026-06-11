from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.models import ChatSession, Keyword, Mention, Project, Report, SentimentResult
from app.services.analytics_service import get_analytics_overview
from app.services.gdelt_service import search_gdelt_articles

TRENDING_QUERIES = [
    "technology",
    "artificial intelligence",
    "business",
    "market",
    "product launch",
]


def get_dashboard_summary(db: Session, user_id: int) -> Dict[str, Any]:
    project_ids = [
        p.id
        for p in db.query(Project.id).filter(Project.user_id == user_id).all()
    ]
    total_projects = len(project_ids)

    total_mentions = 0
    total_analyzed = 0
    if project_ids:
        total_mentions = (
            db.query(Mention).filter(Mention.project_id.in_(project_ids)).count()
        )
        total_analyzed = (
            db.query(SentimentResult)
            .join(Mention, SentimentResult.mention_id == Mention.id)
            .filter(Mention.project_id.in_(project_ids))
            .count()
        )

    total_reports = (
        db.query(Report).filter(Report.project_id.in_(project_ids)).count()
        if project_ids
        else 0
    )

    projects = (
        db.query(Project)
        .filter(Project.user_id == user_id)
        .order_by(Project.updated_at.desc())
        .limit(5)
        .all()
    )

    recent_projects: List[Dict[str, Any]] = []
    latest_sentiment: Optional[Dict[str, Any]] = None

    for project in projects:
        overview = get_analytics_overview(db, project.id)
        keyword_count = (
            db.query(Keyword).filter(Keyword.project_id == project.id).count()
        )
        recent_projects.append(
            {
                "id": project.id,
                "name": project.name,
                "mentions_count": overview["total_mentions"],
                "keywords_count": keyword_count,
                "positive_percentage": overview["positive_percentage"],
                "negative_percentage": overview["negative_percentage"],
            }
        )
        if latest_sentiment is None and overview["total_analyzed"] > 0:
            latest_sentiment = {
                "project_id": project.id,
                "project_name": project.name,
                "positive": overview["positive"],
                "neutral": overview["neutral"],
                "negative": overview["negative"],
                "average_score": overview["average_score"],
            }

    return {
        "total_projects": total_projects,
        "total_mentions": total_mentions,
        "total_analyzed": total_analyzed,
        "total_reports": total_reports,
        "recent_projects": recent_projects,
        "latest_sentiment": latest_sentiment,
    }


def get_trending_news(limit: int = 8) -> Dict[str, Any]:
    items: List[Dict[str, Any]] = []
    seen_titles: set[str] = set()

    for query in TRENDING_QUERIES:
        if len(items) >= limit:
            break
        articles = search_gdelt_articles(query, max_records=3)
        for article in articles:
            title = article.get("text", "").split(" — ")[0].strip()
            if not title or title.lower() in seen_titles:
                continue
            seen_titles.add(title.lower())
            url = article.get("url")
            domain = ""
            if url:
                try:
                    domain = urlparse(url).netloc.replace("www.", "")
                except Exception:
                    domain = "news"
            items.append(
                {
                    "title": title[:300],
                    "source": domain or "GDELT",
                    "url": url,
                    "published_at": article.get("published_at"),
                    "suggested_keyword": query,
                }
            )
            if len(items) >= limit:
                break

    message = (
        "Trending news loaded successfully"
        if items
        else "Trending news is temporarily unavailable. Try again later."
    )
    return {"items": items, "message": message}
