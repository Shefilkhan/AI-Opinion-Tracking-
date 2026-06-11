from datetime import datetime
from typing import List, Literal

from pydantic import BaseModel, ConfigDict, Field

KeywordType = Literal["brand", "product", "competitor", "topic", "hashtag", "person"]


class KeywordCreate(BaseModel):
    keyword: str = Field(min_length=1, max_length=255)
    keyword_type: KeywordType = "topic"


class KeywordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    keyword: str
    keyword_type: str
    created_at: datetime


class KeywordListResponse(BaseModel):
    keywords: List[KeywordResponse]
    total: int
