from datetime import datetime
from typing import List, Literal

from pydantic import BaseModel, ConfigDict, Field

SourceName = Literal["reddit", "youtube", "gdelt"]

SUPPORTED_SOURCES = ("reddit", "youtube", "gdelt")

DEFAULT_SOURCES = [
    {"source_name": "reddit", "is_enabled": True},
    {"source_name": "youtube", "is_enabled": True},
    {"source_name": "gdelt", "is_enabled": False},
]


class SourceItem(BaseModel):
    source_name: SourceName
    is_enabled: bool


class SourceUpdate(BaseModel):
    source_name: SourceName
    is_enabled: bool


class SourceBulkUpdate(BaseModel):
    sources: List[SourceUpdate] = Field(min_length=1)


class SourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    source_name: str
    is_enabled: bool
    created_at: datetime


class SourceListResponse(BaseModel):
    sources: List[SourceResponse]
