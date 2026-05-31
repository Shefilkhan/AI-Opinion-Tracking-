from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user
from app.api.project_deps import get_owned_project
from app.db.database import get_db
from app.db.models import ChatMessage, ChatSession, User
from app.schemas.chat import (
    ChatAskRequest,
    ChatAskResponse,
    ChatMessageResponse,
    ChatSessionListResponse,
    ChatSessionResponse,
    ChatSentimentSnapshot,
    SupportingMentionItem,
)
from app.services import chat_service

router = APIRouter(prefix="/api", tags=["chat"])


@router.post(
    "/projects/{project_id}/chat/ask",
    response_model=ChatAskResponse,
)
def ask_project_chat(
    project_id: int,
    body: ChatAskRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_owned_project(project_id, current_user, db)
    answer = chat_service.generate_answer(db, project.id, body.question)
    try:
        session = chat_service.save_chat_interaction(
            db,
            current_user.id,
            project.id,
            body.session_id,
            body.question,
            answer,
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found",
        )

    return ChatAskResponse(
        session_id=session.id,
        answer=answer["answer"],
        intent=answer["intent"],
        sources_used=answer.get("sources_used", []),
        sentiment=ChatSentimentSnapshot(**answer.get("sentiment", {})),
        supporting_mentions=[
            SupportingMentionItem(**m) for m in answer.get("supporting_mentions", [])
        ],
    )


@router.get(
    "/projects/{project_id}/chat/sessions",
    response_model=ChatSessionListResponse,
)
def list_project_chat_sessions(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_owned_project(project_id, current_user, db)
    sessions = (
        db.query(ChatSession)
        .filter(
            ChatSession.project_id == project.id,
            ChatSession.user_id == current_user.id,
        )
        .order_by(ChatSession.created_at.desc())
        .all()
    )
    return ChatSessionListResponse(
        sessions=[
            ChatSessionResponse(
                id=s.id,
                user_id=s.user_id,
                project_id=s.project_id,
                title=s.title,
                created_at=s.created_at,
                messages=[],
            )
            for s in sessions
        ]
    )


@router.get(
    "/chat/sessions/{session_id}",
    response_model=ChatSessionResponse,
)
def get_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = (
        db.query(ChatSession)
        .options(joinedload(ChatSession.messages))
        .filter(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id,
        )
        .first()
    )
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found",
        )

    messages = chat_service.db_messages_sorted(session.messages)
    return ChatSessionResponse(
        id=session.id,
        user_id=session.user_id,
        project_id=session.project_id,
        title=session.title,
        created_at=session.created_at,
        messages=[
            ChatMessageResponse(**chat_service.message_to_response(m))
            for m in messages
        ],
    )


@router.delete(
    "/chat/sessions/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = (
        db.query(ChatSession)
        .filter(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id,
        )
        .first()
    )
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found",
        )
    db.delete(session)
    db.commit()
    return None
