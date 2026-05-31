import json
import time
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models import Keyword, Mention, Source
from app.services.gdelt_service import search_gdelt_articles
from app.services.reddit_service import (
    RATE_LIMIT_NOTE,
    RedditApiError,
    RedditConfigError,
    collect_reddit_for_keyword,
)
from app.services.youtube_service import YouTubeApiError, collect_youtube_for_keyword

GDELT_SOURCE = "gdelt"
YOUTUBE_SOURCE = "youtube"
REDDIT_SOURCE = "reddit"
RECORDS_PER_KEYWORD = 10


def _is_source_enabled(db: Session, project_id: int, source_name: str) -> bool:
    row = (
        db.query(Source)
        .filter(Source.project_id == project_id, Source.source_name == source_name)
        .first()
    )
    return row.is_enabled if row else False


def _mention_exists(
    db: Session, project_id: int, source: str, source_item_id: str
) -> bool:
    return (
        db.query(Mention.id)
        .filter(
            Mention.project_id == project_id,
            Mention.source == source,
            Mention.source_item_id == source_item_id,
        )
        .first()
        is not None
    )


def _insert_mention(
    db: Session, project_id: int, source: str, item: Dict[str, Any]
) -> bool:
    """Insert mention if not duplicate. Returns True if inserted."""
    source_item_id = item["source_item_id"]
    if _mention_exists(db, project_id, source, source_item_id):
        return False

    mention = Mention(
        project_id=project_id,
        source=source,
        source_item_id=source_item_id,
        source_parent_id=item.get("source_parent_id"),
        author=item.get("author"),
        text=item["text"],
        cleaned_text=item["text"],
        url=item.get("url"),
        published_at=item.get("published_at"),
        engagement_score=item.get("engagement_score", 0),
        raw_json=json.dumps(item.get("raw_json", {})),
    )
    db.add(mention)
    return True


def collect_gdelt_for_project(
    db: Session,
    project_id: int,
    *,
    force: bool = False,
) -> Dict[str, Any]:
    """Collect GDELT articles for all project keywords."""
    keywords: List[Keyword] = (
        db.query(Keyword).filter(Keyword.project_id == project_id).all()
    )
    if not keywords:
        return {
            "source": GDELT_SOURCE,
            "keywords_checked": 0,
            "fetched": 0,
            "inserted": 0,
            "duplicates_skipped": 0,
            "message": "No keywords configured. Add keywords before collecting data.",
        }

    gdelt_enabled = _is_source_enabled(db, project_id, GDELT_SOURCE)
    warning = None
    if not gdelt_enabled and force:
        warning = "GDELT source is disabled; collection ran anyway."
    elif not gdelt_enabled and not force:
        warning = "GDELT source is disabled for this project."

    fetched = 0
    inserted = 0
    duplicates_skipped = 0
    seen_global: set[str] = set()

    for i, kw in enumerate(keywords):
        if i > 0:
            time.sleep(1.0)
        articles = search_gdelt_articles(kw.keyword, max_records=RECORDS_PER_KEYWORD)
        fetched += len(articles)
        for item in articles:
            sid = item["source_item_id"]
            if sid in seen_global:
                duplicates_skipped += 1
                continue
            seen_global.add(sid)

            if _mention_exists(db, project_id, GDELT_SOURCE, sid):
                duplicates_skipped += 1
                continue

            if _insert_mention(db, project_id, GDELT_SOURCE, item):
                inserted += 1
            else:
                duplicates_skipped += 1

    db.commit()

    message = (
        f"GDELT collection complete: {inserted} new mention(s) from "
        f"{len(keywords)} keyword(s)."
    )
    if warning:
        message = f"{warning} {message}"

    return {
        "source": GDELT_SOURCE,
        "keywords_checked": len(keywords),
        "fetched": fetched,
        "inserted": inserted,
        "duplicates_skipped": duplicates_skipped,
        "message": message,
        "warning": warning,
    }


def collect_youtube_for_project(
    db: Session,
    project_id: int,
    *,
    force: bool = False,
) -> Dict[str, Any]:
    """Collect YouTube comments for all project keywords."""
    settings = get_settings()
    keywords: List[Keyword] = (
        db.query(Keyword).filter(Keyword.project_id == project_id).all()
    )

    empty = {
        "source": YOUTUBE_SOURCE,
        "keywords_checked": 0,
        "videos_checked": 0,
        "fetched": 0,
        "inserted": 0,
        "duplicates_skipped": 0,
        "message": "",
    }

    if not settings.youtube_api_key.strip():
        return {
            **empty,
            "message": (
                "YouTube API key is not configured. Set YOUTUBE_API_KEY in backend .env."
            ),
        }

    if not keywords:
        return {
            **empty,
            "message": "No keywords configured. Add keywords before collecting data.",
        }

    youtube_enabled = _is_source_enabled(db, project_id, YOUTUBE_SOURCE)
    warning = None
    if not youtube_enabled and force:
        warning = "YouTube source is disabled; collection ran anyway."
    elif not youtube_enabled and not force:
        warning = "YouTube source is disabled for this project."

    max_videos = settings.youtube_max_videos_per_keyword
    max_comments = settings.youtube_max_comments_per_video
    units_per_keyword = 100 + max_videos * 1
    quota_note = (
        f"Approx. {units_per_keyword} quota units per keyword "
        f"(search.list=100 + up to {max_videos} commentThreads.list=1 each). "
        f"Defaults: {max_videos} videos, {max_comments} comments per video."
    )

    fetched = 0
    inserted = 0
    duplicates_skipped = 0
    videos_checked = 0
    seen_global: set[str] = set()
    quota_hit = False
    errors: List[str] = []

    for kw in keywords:
        try:
            batch = collect_youtube_for_keyword(
                kw.keyword,
                max_videos=max_videos,
                max_comments=max_comments,
            )
        except YouTubeApiError as exc:
            errors.append(str(exc))
            if exc.quota_exceeded:
                quota_hit = True
                break
            continue

        if batch.get("quota_exceeded"):
            quota_hit = True
            if batch.get("error"):
                errors.append(batch["error"])
            break

        if batch.get("error"):
            errors.append(batch["error"])

        videos_checked += len(batch.get("videos", []))
        for comment in batch.get("comments", []):
            fetched += 1
            sid = comment["source_item_id"]
            if sid in seen_global:
                duplicates_skipped += 1
                continue
            seen_global.add(sid)

            if _mention_exists(db, project_id, YOUTUBE_SOURCE, sid):
                duplicates_skipped += 1
                continue

            if _insert_mention(db, project_id, YOUTUBE_SOURCE, comment):
                inserted += 1
            else:
                duplicates_skipped += 1

    db.commit()

    message = (
        f"YouTube collection complete: {inserted} new comment(s) from "
        f"{len(keywords)} keyword(s), {videos_checked} video(s) checked."
    )
    if quota_hit:
        message = (
            f"YouTube quota limit reached. Partial results: {inserted} inserted. "
            + (errors[-1] if errors else "")
        )
    if warning:
        message = f"{warning} {message}"

    return {
        "source": YOUTUBE_SOURCE,
        "keywords_checked": len(keywords),
        "videos_checked": videos_checked,
        "fetched": fetched,
        "inserted": inserted,
        "duplicates_skipped": duplicates_skipped,
        "message": message.strip(),
        "warning": warning,
        "quota_note": quota_note,
    }


def collect_reddit_for_project(
    db: Session,
    project_id: int,
    *,
    force: bool = False,
) -> Dict[str, Any]:
    """Collect Reddit posts and top-level comments for all project keywords."""
    settings = get_settings()
    keywords: List[Keyword] = (
        db.query(Keyword).filter(Keyword.project_id == project_id).all()
    )

    empty = {
        "source": REDDIT_SOURCE,
        "keywords_checked": 0,
        "posts_checked": 0,
        "comments_checked": 0,
        "fetched": 0,
        "inserted": 0,
        "duplicates_skipped": 0,
        "message": "",
    }

    required = [
        settings.reddit_client_id,
        settings.reddit_client_secret,
        settings.reddit_username,
        settings.reddit_password,
        settings.reddit_user_agent,
    ]
    if not all(v.strip() for v in required):
        return {
            **empty,
            "message": (
                "Reddit credentials are not configured. Set REDDIT_CLIENT_ID, "
                "REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD, and "
                "REDDIT_USER_AGENT in backend .env."
            ),
        }

    if not keywords:
        return {
            **empty,
            "message": "No keywords configured. Add keywords before collecting data.",
        }

    reddit_enabled = _is_source_enabled(db, project_id, REDDIT_SOURCE)
    warning = None
    if not reddit_enabled and force:
        warning = "Reddit source is disabled; collection ran anyway."
    elif not reddit_enabled and not force:
        warning = "Reddit source is disabled for this project."

    max_posts = settings.reddit_max_posts_per_keyword
    max_comments = settings.reddit_max_comments_per_post
    rate_limit_note = (
        f"{RATE_LIMIT_NOTE} Defaults: {max_posts} posts and "
        f"{max_comments} top-level comments per post per keyword."
    )

    fetched = 0
    inserted = 0
    duplicates_skipped = 0
    posts_checked = 0
    comments_checked = 0
    seen_global: set[str] = set()
    rate_limited = False
    errors: List[str] = []

    for i, kw in enumerate(keywords):
        if i > 0:
            time.sleep(0.5)
        try:
            batch = collect_reddit_for_keyword(
                kw.keyword,
                max_posts=max_posts,
                max_comments=max_comments,
            )
        except (RedditApiError, RedditConfigError) as exc:
            errors.append(str(exc))
            if isinstance(exc, RedditApiError) and exc.rate_limited:
                rate_limited = True
                break
            continue

        if batch.get("rate_limited"):
            rate_limited = True
            if batch.get("error"):
                errors.append(batch["error"])
            break

        if batch.get("error") and not batch.get("posts"):
            errors.append(batch["error"])
            if "credentials" in batch["error"].lower():
                break

        posts_checked += len(batch.get("posts", []))
        comments_checked += len(batch.get("comments", []))

        for item in batch.get("posts", []) + batch.get("comments", []):
            fetched += 1
            sid = item["source_item_id"]
            if sid in seen_global:
                duplicates_skipped += 1
                continue
            seen_global.add(sid)

            if _mention_exists(db, project_id, REDDIT_SOURCE, sid):
                duplicates_skipped += 1
                continue

            if _insert_mention(db, project_id, REDDIT_SOURCE, item):
                inserted += 1
            else:
                duplicates_skipped += 1

    db.commit()

    message = (
        f"Reddit collection complete: {inserted} new mention(s) from "
        f"{len(keywords)} keyword(s) ({posts_checked} posts, "
        f"{comments_checked} comments checked)."
    )
    if rate_limited:
        message = (
            f"Reddit rate limit reached. Partial results: {inserted} inserted. "
            + (errors[-1] if errors else "")
        )
    if errors and inserted == 0:
        message = errors[0]
    if warning:
        message = f"{warning} {message}"

    return {
        "source": REDDIT_SOURCE,
        "keywords_checked": len(keywords),
        "posts_checked": posts_checked,
        "comments_checked": comments_checked,
        "fetched": fetched,
        "inserted": inserted,
        "duplicates_skipped": duplicates_skipped,
        "message": message.strip(),
        "warning": warning,
        "rate_limit_note": rate_limit_note,
    }


def collect_all_enabled_sources(db: Session, project_id: int) -> Dict[str, Any]:
    """Collect from all enabled sources (GDELT + YouTube + Reddit)."""
    sources = db.query(Source).filter(Source.project_id == project_id).all()
    enabled = {s.source_name: s.is_enabled for s in sources}

    results: Dict[str, Any] = {}
    messages: List[str] = []

    if enabled.get(GDELT_SOURCE, False):
        gdelt_result = collect_gdelt_for_project(db, project_id, force=False)
        results[GDELT_SOURCE] = gdelt_result
        messages.append(gdelt_result.get("message", ""))
    else:
        results[GDELT_SOURCE] = {
            "source": GDELT_SOURCE,
            "keywords_checked": 0,
            "fetched": 0,
            "inserted": 0,
            "duplicates_skipped": 0,
            "message": "GDELT source is not enabled.",
        }

    if enabled.get(YOUTUBE_SOURCE, False):
        youtube_result = collect_youtube_for_project(db, project_id, force=False)
        results[YOUTUBE_SOURCE] = youtube_result
        messages.append(youtube_result.get("message", ""))
    else:
        results[YOUTUBE_SOURCE] = {
            "source": YOUTUBE_SOURCE,
            "keywords_checked": 0,
            "videos_checked": 0,
            "fetched": 0,
            "inserted": 0,
            "duplicates_skipped": 0,
            "message": "YouTube source is not enabled.",
        }

    if enabled.get(REDDIT_SOURCE, False):
        reddit_result = collect_reddit_for_project(db, project_id, force=False)
        results[REDDIT_SOURCE] = reddit_result
        messages.append(reddit_result.get("message", ""))
    else:
        results[REDDIT_SOURCE] = {
            "source": REDDIT_SOURCE,
            "keywords_checked": 0,
            "posts_checked": 0,
            "comments_checked": 0,
            "fetched": 0,
            "inserted": 0,
            "duplicates_skipped": 0,
            "message": "Reddit source is not enabled.",
        }

    total_inserted = 0
    total_fetched = 0
    for key in (GDELT_SOURCE, YOUTUBE_SOURCE, REDDIT_SOURCE):
        val = results.get(key)
        if isinstance(val, dict):
            total_inserted += val.get("inserted", 0)
            total_fetched += val.get("fetched", 0)

    return {
        "results": results,
        "total_inserted": total_inserted,
        "total_fetched": total_fetched,
        "message": " ".join(m for m in messages if m),
    }
