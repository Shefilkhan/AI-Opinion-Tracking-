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


class PulseChatMessageRequest(BaseModel):
    message: str = Field(min_length=1, max_length=500)
    conversation_id: Optional[str] = None


class PulseChatDataUsed(BaseModel):
    query: Optional[str] = None
    results_count: int = 0
    sentiment: dict = Field(default_factory=dict)
    platforms: List[str] = Field(default_factory=list)


class PulseChatMessageResponse(BaseModel):
    conversation_id: str
    message: str
    suggestions: List[str] = Field(default_factory=list)
    data_used: PulseChatDataUsed = Field(default_factory=PulseChatDataUsed)
    wiki_summary: Optional[dict] = None
    has_real_data: bool = False


class PulseConversationSummary(BaseModel):
    conversation_id: str
    started_at: datetime
    message_count: int
    first_message: str = ""


class PulseConversationListResponse(BaseModel):
    conversations: List[PulseConversationSummary]


class PulseConversationMessagesResponse(BaseModel):
    messages: List[dict]
