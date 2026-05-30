from typing import Any, Dict, Optional, Union

from pydantic import BaseModel


class CollectionSourceResult(BaseModel):
    source: str
    keywords_checked: int
    fetched: int
    inserted: int
    duplicates_skipped: int
    message: Optional[str] = None


class CollectionResponse(BaseModel):
    source: Optional[str] = None
    keywords_checked: int = 0
    fetched: int = 0
    inserted: int = 0
    duplicates_skipped: int = 0
    message: str = ""


class CollectAllResponse(BaseModel):
    results: Dict[str, Union[CollectionSourceResult, str]]
    total_inserted: int
    total_fetched: int
    message: str
