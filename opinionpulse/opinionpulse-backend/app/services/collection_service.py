import json
import time
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.db.models import Keyword, Mention, Source
from app.services.gdelt_service import search_gdelt_articles

GDELT_SOURCE = "gdelt"
RECORDS_PER_KEYWORD = 10


def _is_gdelt_enabled(db: Session, project_id: int) -> bool:
    row = (
        db.query(Source)
        .filter(Source.project_id == project_id, Source.source_name == GDELT_SOURCE)
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


def _insert_mention(db: Session, project_id: int, item: Dict[str, Any]) -> bool:
    """Insert mention if not duplicate. Returns True if inserted."""
    source_item_id = item["source_item_id"]
    if _mention_exists(db, project_id, GDELT_SOURCE, source_item_id):
        return False

    mention = Mention(
        project_id=project_id,
        source=GDELT_SOURCE,
        source_item_id=source_item_id,
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
    """
    Collect GDELT articles for all project keywords.
    force=True allows collection even when GDELT source is disabled (with warning).
    """
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

    gdelt_enabled = _is_gdelt_enabled(db, project_id)
    warning = None
    if not gdelt_enabled and not force:
        warning = "GDELT source is disabled for this project."
    elif not gdelt_enabled and force:
        warning = "GDELT source is disabled; collection ran anyway."

    fetched = 0
    inserted = 0
    duplicates_skipped = 0
    seen_global: set[str] = set()

    for i, kw in enumerate(keywords):
        if i > 0:
            time.sleep(1.0)  # reduce GDELT rate-limit (429) risk between keywords
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

            if _insert_mention(db, project_id, item):
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
    }


def collect_all_enabled_sources(db: Session, project_id: int) -> Dict[str, Any]:
    """Collect from enabled sources. Only GDELT is implemented in Part 9A."""
    sources = (
        db.query(Source).filter(Source.project_id == project_id).all()
    )
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
            "message": "GDELT source is not enabled. Enable it in source settings or use Collect GDELT News.",
        }

    if enabled.get("youtube", False):
        results["youtube"] = "not implemented yet"
        messages.append("YouTube: not implemented yet.")

    if enabled.get("reddit", False):
        results["reddit"] = "not implemented yet"
        messages.append("Reddit: not implemented yet.")

    total_inserted = 0
    total_fetched = 0
    if isinstance(results.get(GDELT_SOURCE), dict):
        total_inserted += results[GDELT_SOURCE].get("inserted", 0)
        total_fetched += results[GDELT_SOURCE].get("fetched", 0)

    return {
        "results": results,
        "total_inserted": total_inserted,
        "total_fetched": total_fetched,
        "message": " ".join(m for m in messages if m),
    }
