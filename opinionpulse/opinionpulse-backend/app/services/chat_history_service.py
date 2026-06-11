"""Persist Pulse AI chat messages per user conversation."""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.models import PulseChatMessage

logger = logging.getLogger(__name__)


def save_message(
    db: Session,
    user_id: int,
    conversation_id: str,
    role: str,
    content: str,
    metadata: dict[str, Any] | None = None,
) -> PulseChatMessage | None:
    try:
        row = PulseChatMessage(
            user_id=int(user_id),
            conversation_id=str(conversation_id),
            role=role,
            content=content,
            metadata_json=metadata or {},
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        return row
    except Exception as exc:
        db.rollback()
        logger.exception("Failed to save chat message: %s", exc)
        raise


def get_conversation(
    db: Session,
    user_id: int,
    conversation_id: str,
) -> list[dict[str, Any]]:
    try:
        rows = (
            db.query(PulseChatMessage)
            .filter(
                PulseChatMessage.user_id == int(user_id),
                PulseChatMessage.conversation_id == str(conversation_id),
            )
            .order_by(PulseChatMessage.created_at.asc())
            .all()
        )
        return [_row_to_dict(row) for row in rows]
    except Exception as exc:
        logger.exception("Failed to load chat conversation: %s", exc)
        raise


def get_user_conversations(db: Session, user_id: int) -> list[dict[str, Any]]:
    first_user_msg = (
        db.query(
            PulseChatMessage.conversation_id,
            func.min(PulseChatMessage.created_at).label("started_at"),
            func.count(PulseChatMessage.id).label("message_count"),
        )
        .filter(PulseChatMessage.user_id == user_id)
        .group_by(PulseChatMessage.conversation_id)
        .order_by(func.min(PulseChatMessage.created_at).desc())
        .limit(50)
        .all()
    )

    conversations: list[dict[str, Any]] = []
    for conv_id, started_at, message_count in first_user_msg:
        first_message_row = (
            db.query(PulseChatMessage.content)
            .filter(
                PulseChatMessage.user_id == user_id,
                PulseChatMessage.conversation_id == conv_id,
                PulseChatMessage.role == "user",
            )
            .order_by(PulseChatMessage.created_at.asc())
            .first()
        )
        conversations.append(
            {
                "conversation_id": conv_id,
                "started_at": started_at,
                "message_count": int(message_count or 0),
                "first_message": first_message_row[0] if first_message_row else "",
            }
        )
    return conversations


def delete_conversation(
    db: Session,
    user_id: int,
    conversation_id: str,
) -> None:
    (
        db.query(PulseChatMessage)
        .filter(
            PulseChatMessage.user_id == user_id,
            PulseChatMessage.conversation_id == conversation_id,
        )
        .delete(synchronize_session=False)
    )
    db.commit()


def _row_to_dict(row: PulseChatMessage) -> dict[str, Any]:
    metadata = row.metadata_json if isinstance(row.metadata_json, dict) else {}
    return {
        "id": row.id,
        "role": row.role,
        "content": row.content,
        "metadata": metadata,
        "created_at": row.created_at,
    }
