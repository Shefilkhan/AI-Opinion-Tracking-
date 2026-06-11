from typing import Any, Dict, Optional, Union

from pydantic import BaseModel


class CollectionSourceResult(BaseModel):
    source: str
    keywords_checked: int
    fetched: int
    inserted: int
    duplicates_skipped: int
    message: Optional[str] = None
    videos_checked: Optional[int] = None
    quota_note: Optional[str] = None
    warning: Optional[str] = None
    posts_checked: Optional[int] = None
    comments_checked: Optional[int] = None
    rate_limit_note: Optional[str] = None


class CollectionResponse(BaseModel):
    source: Optional[str] = None
    keywords_checked: int = 0
    fetched: int = 0
    inserted: int = 0
    duplicates_skipped: int = 0
    message: str = ""
    videos_checked: Optional[int] = None
    quota_note: Optional[str] = None
    warning: Optional[str] = None
    posts_checked: Optional[int] = None
    comments_checked: Optional[int] = None
    rate_limit_note: Optional[str] = None


class CollectAllResponse(BaseModel):
    results: Dict[str, Union[CollectionSourceResult, str]]
    total_inserted: int
    total_fetched: int
    message: str
