from datetime import datetime
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.sentiment import SentimentBrief

MentionSource = Literal["reddit", "youtube", "gdelt", "hackernews", "manual"]
ALLOWED_SOURCES = ("reddit", "youtube", "gdelt", "hackernews", "manual")


class MentionCreate(BaseModel):
    source: MentionSource = "manual"
    author: Optional[str] = None
    text: str = Field(min_length=1)
    url: Optional[str] = None
    published_at: Optional[datetime] = None
    engagement_score: int = 0


class MentionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    source: str
    source_item_id: Optional[str]
    source_parent_id: Optional[str]
    author: Optional[str]
    text: str
    cleaned_text: Optional[str]
    url: Optional[str]
    published_at: Optional[datetime]
    engagement_score: int
    created_at: datetime
    sentiment: Optional[SentimentBrief] = None


class GlobalMentionResponse(MentionResponse):
    project_name: str


class MentionListResponse(BaseModel):
    mentions: List[MentionResponse]
    total: int
    limit: int
    offset: int


class GlobalMentionListResponse(BaseModel):
    mentions: List[GlobalMentionResponse]
    total: int
    limit: int
    offset: int


class MentionStatsResponse(BaseModel):
    total_mentions: int
    by_source: Dict[str, int]


class MentionSeedResponse(BaseModel):
    inserted: int
    message: str
