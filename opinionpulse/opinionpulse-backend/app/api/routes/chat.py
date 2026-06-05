"""Pulse AI chat API — Claude + live platform data."""

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.db.models import User
from app.schemas.chat import (
    PulseChatDataUsed,
    PulseChatMessageRequest,
    PulseChatMessageResponse,
    PulseConversationListResponse,
    PulseConversationMessagesResponse,
    PulseConversationSummary,
)
from app.services import chat_history_service, chat_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/message", response_model=PulseChatMessageResponse)
async def send_pulse_chat_message(
    body: PulseChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    message = body.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    conversation_id = body.conversation_id or str(uuid.uuid4())

    try:
        history = chat_history_service.get_conversation(
            db, current_user.id, conversation_id
        )
    except Exception as exc:
        logger.exception("DB history error: %s", exc)
        db.rollback()
        history = []

    formatted_history = [
        {"role": msg["role"], "content": msg["content"]} for msg in history
    ]

    try:
        chat_history_service.save_message(
            db, current_user.id, conversation_id, "user", message
        )
    except Exception as exc:
        logger.exception("DB save error (user message): %s", exc)

    result = await chat_service.process_chat_message(
        message, formatted_history, current_user.id
    )

    try:
        chat_history_service.save_message(
            db,
            current_user.id,
            conversation_id,
            "assistant",
            result["message"],
            metadata={
                "suggestions": result.get("suggestions", []),
                "data_used": result.get("data_used", {}),
                "has_real_data": result.get("has_real_data", False),
            },
        )
    except Exception as exc:
        logger.exception("DB save error (assistant message): %s", exc)

    data_used = result.get("data_used", {})
    return PulseChatMessageResponse(
        conversation_id=conversation_id,
        message=result["message"],
        suggestions=result.get("suggestions", []),
        data_used=PulseChatDataUsed(
            query=data_used.get("query"),
            results_count=data_used.get("results_count", 0),
            sentiment=data_used.get("sentiment", {}),
            platforms=data_used.get("platforms", []),
        ),
        wiki_summary=result.get("wiki_summary"),
        has_real_data=result.get("has_real_data", False),
    )


@router.get("/conversations", response_model=PulseConversationListResponse)
def list_pulse_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        conversations = chat_history_service.get_user_conversations(
            db, current_user.id
        )
    except Exception as exc:
        logger.exception("DB list conversations error: %s", exc)
        db.rollback()
        conversations = []

    return PulseConversationListResponse(
        conversations=[
            PulseConversationSummary(
                conversation_id=c["conversation_id"],
                started_at=c["started_at"],
                message_count=c["message_count"],
                first_message=c.get("first_message") or "",
            )
            for c in conversations
        ]
    )


@router.get(
    "/conversations/{conversation_id}",
    response_model=PulseConversationMessagesResponse,
)
def get_pulse_conversation_messages(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        messages = chat_history_service.get_conversation(
            db, current_user.id, conversation_id
        )
    except Exception as exc:
        logger.exception("DB get conversation error: %s", exc)
        db.rollback()
        messages = []

    return PulseConversationMessagesResponse(messages=messages)


@router.delete("/conversations/{conversation_id}")
def delete_pulse_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        chat_history_service.delete_conversation(
            db, current_user.id, conversation_id
        )
    except Exception as exc:
        logger.exception("DB delete conversation error: %s", exc)
        db.rollback()
        raise HTTPException(status_code=500, detail="Could not delete conversation") from exc
    return {"success": True}


@router.get("/export/{conversation_id}")
def export_pulse_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        messages = chat_history_service.get_conversation(
            db, current_user.id, conversation_id
        )
    except Exception as exc:
        logger.exception("DB export error: %s", exc)
        db.rollback()
        raise HTTPException(status_code=500, detail="Could not export conversation") from exc

    if not messages:
        raise HTTPException(status_code=404, detail="Conversation not found")

    export_lines = [
        "OpinionPulse — Pulse AI Chat Export",
        f"Conversation ID: {conversation_id}",
        "=" * 50,
        "",
    ]

    for msg in messages:
        role = "You" if msg["role"] == "user" else "Pulse AI"
        created = msg.get("created_at")
        if hasattr(created, "strftime"):
            time_str = created.strftime("%Y-%m-%d %H:%M")
        else:
            time_str = str(created)
        export_lines.append(f"[{time_str}] {role}:")
        export_lines.append(msg["content"])
        export_lines.append("")

    content = "\n".join(export_lines)
    return PlainTextResponse(
        content=content,
        headers={
            "Content-Disposition": (
                f'attachment; filename="pulse-ai-chat-{conversation_id[:8]}.txt"'
            )
        },
    )
