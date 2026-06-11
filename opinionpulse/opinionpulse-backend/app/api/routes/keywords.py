from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.project_deps import get_owned_keyword, get_owned_project
from app.db.database import get_db
from app.db.models import Keyword, User
from app.schemas.keyword import KeywordCreate, KeywordListResponse, KeywordResponse

router = APIRouter(prefix="/api", tags=["keywords"])


@router.get("/projects/{project_id}/keywords", response_model=KeywordListResponse)
def list_keywords(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_owned_project(project_id, current_user, db)
    keywords = (
        db.query(Keyword)
        .filter(Keyword.project_id == project.id)
        .order_by(Keyword.created_at.desc())
        .all()
    )
    return KeywordListResponse(
        keywords=[KeywordResponse.model_validate(k) for k in keywords],
        total=len(keywords),
    )


@router.post(
    "/projects/{project_id}/keywords",
    response_model=KeywordResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_keyword(
    project_id: int,
    payload: KeywordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_owned_project(project_id, current_user, db)
    keyword_text = payload.keyword.strip()
    if not keyword_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Keyword cannot be empty",
        )

    existing = (
        db.query(Keyword)
        .filter(
            Keyword.project_id == project.id,
            Keyword.keyword == keyword_text,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Keyword already exists in this project",
        )

    keyword = Keyword(
        project_id=project.id,
        keyword=keyword_text,
        keyword_type=payload.keyword_type,
    )
    db.add(keyword)
    db.commit()
    db.refresh(keyword)
    return KeywordResponse.model_validate(keyword)


@router.delete("/keywords/{keyword_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_keyword(
    keyword_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    keyword = get_owned_keyword(keyword_id, current_user, db)
    db.delete(keyword)
    db.commit()
    return None
