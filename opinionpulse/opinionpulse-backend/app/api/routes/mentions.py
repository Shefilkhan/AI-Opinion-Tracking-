import json
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.project_deps import get_owned_mention, get_owned_project
from app.db.database import get_db
from app.db.models import Mention, Project, User
from app.schemas.mention import (
    ALLOWED_SOURCES,
    MentionCreate,
    MentionListResponse,
    MentionResponse,
    MentionSeedResponse,
    MentionStatsResponse,
)

router = APIRouter(prefix="/api", tags=["mentions"])

SAMPLE_MENTIONS = [
    {
        "source": "manual",
        "author": "Test User",
        "text": "People are complaining about the high price compared to competitors.",
        "engagement_score": 12,
    },
    {
        "source": "reddit",
        "author": "u/price_watcher",
        "text": "The subscription went up again. Not sure it's worth it anymore.",
        "url": "https://reddit.com/r/example/comments/abc",
        "engagement_score": 245,
        "source_item_id": "reddit_abc123",
    },
    {
        "source": "youtube",
        "author": "Viewer123",
        "text": "Great product but customer support took forever to respond.",
        "url": "https://youtube.com/watch?v=example",
        "engagement_score": 89,
        "source_item_id": "yt_comment_001",
    },
    {
        "source": "gdelt",
        "author": "Tech Daily",
        "text": "Analysts note mixed reception following the latest pricing announcement.",
        "url": "https://news.example.com/article/pricing",
        "engagement_score": 0,
        "source_item_id": "gdelt_evt_442",
    },
    {
        "source": "reddit",
        "author": "u/happy_customer",
        "text": "Honestly love the new features. Delivery was fast and packaging was great.",
        "engagement_score": 156,
        "source_item_id": "reddit_def456",
    },
    {
        "source": "manual",
        "author": "Research Note",
        "text": "Survey respondents cited user experience as the top positive theme.",
        "engagement_score": 5,
    },
    {
        "source": "youtube",
        "author": "ReviewChannel",
        "text": "Build quality is solid but the app crashes on older devices.",
        "engagement_score": 412,
        "source_item_id": "yt_comment_002",
    },
    {
        "source": "gdelt",
        "author": "Business Wire",
        "text": "Company faces backlash over account sharing restrictions in multiple markets.",
        "engagement_score": 0,
        "source_item_id": "gdelt_evt_443",
    },
    {
        "source": "hackernews",
        "author": "hn_user_99",
        "text": "Interesting approach to sentiment tracking. Pricing model seems aggressive though.",
        "url": "https://news.ycombinator.com/item?id=example",
        "engagement_score": 67,
        "source_item_id": "hn_998877",
    },
    {
        "source": "reddit",
        "author": "u/feature_fan",
        "text": "The keyword tracking dashboard is exactly what our team needed.",
        "engagement_score": 78,
        "source_item_id": "reddit_ghi789",
    },
    {
        "source": "manual",
        "author": "Demo Entry",
        "text": "Users mention slow delivery during peak season as a recurring complaint.",
        "engagement_score": 3,
    },
    {
        "source": "youtube",
        "author": "CommenterX",
        "text": "Price increases every year. When does it stop?",
        "engagement_score": 201,
        "source_item_id": "yt_comment_003",
    },
]


def _validate_source(source: str) -> None:
    if source not in ALLOWED_SOURCES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid source. Allowed: {', '.join(ALLOWED_SOURCES)}",
        )


@router.get("/projects/{project_id}/mentions", response_model=MentionListResponse)
def list_mentions(
    project_id: int,
    source: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_owned_project(project_id, current_user, db)
    query = db.query(Mention).filter(Mention.project_id == project.id)

    if source:
        if source != "all":
            _validate_source(source)
            query = query.filter(Mention.source == source)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(Mention.text.ilike(term))

    total = query.count()
    mentions = (
        query.order_by(Mention.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return MentionListResponse(
        mentions=[MentionResponse.model_validate(m) for m in mentions],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post(
    "/projects/{project_id}/mentions",
    response_model=MentionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_mention(
    project_id: int,
    payload: MentionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_owned_project(project_id, current_user, db)
    _validate_source(payload.source)

    text = payload.text.strip()
    if not text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text cannot be empty",
        )

    mention = Mention(
        project_id=project.id,
        source=payload.source,
        author=payload.author,
        text=text,
        cleaned_text=text,
        url=payload.url,
        published_at=payload.published_at or datetime.now(timezone.utc),
        engagement_score=payload.engagement_score,
    )
    db.add(mention)
    db.commit()
    db.refresh(mention)
    return MentionResponse.model_validate(mention)


@router.get(
    "/projects/{project_id}/mentions/stats",
    response_model=MentionStatsResponse,
)
def mention_stats(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_owned_project(project_id, current_user, db)

    counts = (
        db.query(Mention.source, func.count(Mention.id))
        .filter(Mention.project_id == project.id)
        .group_by(Mention.source)
        .all()
    )

    by_source = {name: 0 for name in ALLOWED_SOURCES}
    for source_name, count in counts:
        by_source[source_name] = count

    total = sum(by_source.values())
    return MentionStatsResponse(total_mentions=total, by_source=by_source)


@router.post(
    "/projects/{project_id}/mentions/seed",
    response_model=MentionSeedResponse,
)
def seed_mentions(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_owned_project(project_id, current_user, db)

    existing = (
        db.query(Mention).filter(Mention.project_id == project.id).count()
    )
    if existing >= 5:
        return MentionSeedResponse(
            inserted=0,
            message="Project already has mentions. Seed skipped to avoid duplicates.",
        )

    inserted = 0
    now = datetime.now(timezone.utc)
    for item in SAMPLE_MENTIONS:
        mention = Mention(
            project_id=project.id,
            source=item["source"],
            author=item.get("author"),
            text=item["text"],
            cleaned_text=item["text"],
            url=item.get("url"),
            published_at=now,
            engagement_score=item.get("engagement_score", 0),
            source_item_id=item.get("source_item_id"),
            raw_json=json.dumps({"seed": True, "source": item["source"]}),
        )
        db.add(mention)
        inserted += 1

    db.commit()
    return MentionSeedResponse(
        inserted=inserted,
        message="Sample mentions added successfully",
    )


@router.delete("/mentions/{mention_id}")
def delete_mention(
    mention_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    mention = get_owned_mention(mention_id, current_user, db)
    db.delete(mention)
    db.commit()
    return {"message": "Mention deleted successfully"}
