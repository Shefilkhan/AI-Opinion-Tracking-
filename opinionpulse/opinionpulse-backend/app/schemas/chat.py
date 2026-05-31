from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class ChatAskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    session_id: Optional[int] = None


class SupportingMentionItem(BaseModel):
    id: int
    source: str
    text: str
    sentiment_label: str
    sentiment_score: float
    url: Optional[str] = None
    author: Optional[str] = None


class ChatSentimentSnapshot(BaseModel):
    positive: int = 0
    neutral: int = 0
    negative: int = 0


class ChatAskResponse(BaseModel):
    session_id: int
    answer: str
    intent: str
    sources_used: List[str]
    sentiment: ChatSentimentSnapshot
    supporting_mentions: List[SupportingMentionItem]


class ChatSessionCreate(BaseModel):
    title: Optional[str] = None


class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: int
    role: str
    content: str
    sources_used: Optional[List[str]] = None
    intent: Optional[str] = None
    sentiment: Optional[ChatSentimentSnapshot] = None
    supporting_mentions: Optional[List[SupportingMentionItem]] = None
    created_at: datetime


class ChatSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    project_id: Optional[int]
    title: Optional[str]
    created_at: datetime
    messages: List[ChatMessageResponse] = []


class ChatSessionListResponse(BaseModel):
    sessions: List[ChatSessionResponse]
