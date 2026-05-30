from typing import List, Optional

from pydantic import BaseModel


class AnalyticsOverviewResponse(BaseModel):
    total_mentions: int
    total_analyzed: int
    positive: int
    neutral: int
    negative: int
    positive_percentage: float
    neutral_percentage: float
    negative_percentage: float
    average_score: float
    top_source: Optional[str] = None
    top_sentiment: Optional[str] = None
    keyword_count: int


class SourceSentimentItem(BaseModel):
    source: str
    total: int
    positive: int
    neutral: int
    negative: int
    average_score: float


class SentimentDistributionItem(BaseModel):
    label: str
    count: int
    percentage: float


class TopMentionItem(BaseModel):
    id: int
    source: str
    author: Optional[str]
    text: str
    sentiment_label: str
    sentiment_score: float
    confidence: float
    url: Optional[str] = None


class TopMentionsResponse(BaseModel):
    top_positive: List[TopMentionItem]
    top_negative: List[TopMentionItem]
