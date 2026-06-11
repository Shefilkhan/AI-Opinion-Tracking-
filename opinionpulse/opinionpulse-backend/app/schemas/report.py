from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

ReportType = Literal["daily", "weekly", "monthly", "custom"]


class ReportGenerateRequest(BaseModel):
    report_type: ReportType = "custom"


class ReportSummarySection(BaseModel):
    total_mentions: int = 0
    total_analyzed: int = 0
    positive: int = 0
    neutral: int = 0
    negative: int = 0
    positive_percentage: float = 0.0
    neutral_percentage: float = 0.0
    negative_percentage: float = 0.0
    average_score: float = 0.0
    keyword_count: int = 0


class SourceSentimentReportItem(BaseModel):
    source: str
    total: int
    positive: int
    neutral: int
    negative: int
    average_score: float


class TopMentionReportItem(BaseModel):
    id: int
    source: str
    author: Optional[str] = None
    text: str
    sentiment_label: str
    sentiment_score: float
    confidence: float
    url: Optional[str] = None


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    project_name: str
    report_type: str
    summary: str
    generated_at: datetime


class ReportListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    report_type: str
    summary: str
    generated_at: datetime


class ReportDetailResponse(BaseModel):
    id: int
    project_id: int
    project_name: str
    report_type: str
    summary: str
    generated_at: datetime
    overview: ReportSummarySection
    source_breakdown: List[SourceSentimentReportItem]
    top_positive: List[TopMentionReportItem]
    top_negative: List[TopMentionReportItem]
    keyword_hints: List[str] = Field(default_factory=list)
    themes_positive: List[str] = Field(default_factory=list)
    themes_negative: List[str] = Field(default_factory=list)


class ReportListResponse(BaseModel):
    reports: List[ReportListItem]


class ExportRow(BaseModel):
    """Documentation schema for CSV row shape."""
    pass
