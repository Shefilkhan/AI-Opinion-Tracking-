from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.project_deps import get_owned_project
from app.db.database import get_db
from app.db.models import Source, User
from app.schemas.source import (
    DEFAULT_SOURCES,
    SUPPORTED_SOURCES,
    SourceBulkUpdate,
    SourceListResponse,
    SourceResponse,
)

router = APIRouter(prefix="/api/projects", tags=["sources"])


@router.get("/{project_id}/sources", response_model=SourceListResponse)
def list_sources(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_owned_project(project_id, current_user, db)
    sources = (
        db.query(Source)
        .filter(Source.project_id == project.id)
        .order_by(Source.source_name)
        .all()
    )

    if not sources:
        for item in DEFAULT_SOURCES:
            db.add(
                Source(
                    project_id=project.id,
                    source_name=item["source_name"],
                    is_enabled=item["is_enabled"],
                )
            )
        db.commit()
        sources = (
            db.query(Source)
            .filter(Source.project_id == project.id)
            .order_by(Source.source_name)
            .all()
        )

    return SourceListResponse(
        sources=[SourceResponse.model_validate(s) for s in sources]
    )


@router.put("/{project_id}/sources", response_model=SourceListResponse)
def update_sources(
    project_id: int,
    payload: SourceBulkUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_owned_project(project_id, current_user, db)

    for item in payload.sources:
        if item.source_name not in SUPPORTED_SOURCES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported source: {item.source_name}",
            )

    existing = {
        s.source_name: s
        for s in db.query(Source).filter(Source.project_id == project.id).all()
    }

    for item in payload.sources:
        if item.source_name in existing:
            existing[item.source_name].is_enabled = item.is_enabled
        else:
            db.add(
                Source(
                    project_id=project.id,
                    source_name=item.source_name,
                    is_enabled=item.is_enabled,
                )
            )

    db.commit()
    sources = (
        db.query(Source)
        .filter(Source.project_id == project.id)
        .order_by(Source.source_name)
        .all()
    )
    return SourceListResponse(
        sources=[SourceResponse.model_validate(s) for s in sources]
    )
