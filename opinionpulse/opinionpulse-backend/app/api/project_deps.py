from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.models import Keyword, Mention, Project, User


def get_owned_project(project_id: int, current_user: User, db: Session) -> Project:
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.user_id == current_user.id)
        .first()
    )
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return project


def get_owned_keyword(keyword_id: int, current_user: User, db: Session) -> Keyword:
    keyword = (
        db.query(Keyword)
        .join(Project)
        .filter(Keyword.id == keyword_id, Project.user_id == current_user.id)
        .first()
    )
    if keyword is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Keyword not found",
        )
    return keyword


def get_owned_mention(mention_id: int, current_user: User, db: Session) -> Mention:
    mention = (
        db.query(Mention)
        .join(Project)
        .filter(Mention.id == mention_id, Project.user_id == current_user.id)
        .first()
    )
    if mention is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mention not found",
        )
    return mention
