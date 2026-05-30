from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.project_deps import get_owned_project
from app.db.database import get_db
from app.db.models import Keyword, User
from app.schemas.collection import (
    CollectAllResponse,
    CollectionResponse,
    CollectionSourceResult,
)
from app.core.config import get_settings
from app.services.collection_service import (
    collect_all_enabled_sources,
    collect_gdelt_for_project,
    collect_youtube_for_project,
)

router = APIRouter(prefix="/api", tags=["collection"])


def _require_keywords(db: Session, project_id: int) -> None:
    count = db.query(Keyword).filter(Keyword.project_id == project_id).count()
    if count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Add at least one keyword before collecting data.",
        )


@router.post(
    "/projects/{project_id}/collect/gdelt",
    response_model=CollectionResponse,
)
def collect_gdelt(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_owned_project(project_id, current_user, db)
    _require_keywords(db, project.id)
    result = collect_gdelt_for_project(db, project.id, force=True)
    return CollectionResponse(**result)


@router.post(
    "/projects/{project_id}/collect/youtube",
    response_model=CollectionResponse,
)
def collect_youtube(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_owned_project(project_id, current_user, db)
    _require_keywords(db, project.id)

    if not get_settings().youtube_api_key.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "YouTube API key is not configured. "
                "Set YOUTUBE_API_KEY in the backend .env file."
            ),
        )

    result = collect_youtube_for_project(db, project.id, force=True)
    return CollectionResponse(**result)


@router.post(
    "/projects/{project_id}/collect/all",
    response_model=CollectAllResponse,
)
def collect_all(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_owned_project(project_id, current_user, db)
    _require_keywords(db, project.id)
    data = collect_all_enabled_sources(db, project.id)

    results = {}
    for key, value in data["results"].items():
        if isinstance(value, dict):
            results[key] = CollectionSourceResult(**value)
        else:
            results[key] = value

    return CollectAllResponse(
        results=results,
        total_inserted=data["total_inserted"],
        total_fetched=data["total_fetched"],
        message=data["message"],
    )
