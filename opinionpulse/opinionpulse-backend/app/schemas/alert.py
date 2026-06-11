from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

AlertType = Literal[
    "negative_sentiment",
    "high_volume",
    "keyword_mention",
    "source_volume",
]


class AlertCreate(BaseModel):
    alert_type: AlertType
    threshold_value: float = Field(gt=0)
    keyword: Optional[str] = None
    source: Optional[str] = None
    is_active: bool = True


class AlertUpdate(BaseModel):
    threshold_value: Optional[float] = Field(default=None, gt=0)
    keyword: Optional[str] = None
    source: Optional[str] = None
    is_active: Optional[bool] = None


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    alert_type: str
    condition_text: str
    threshold_value: float
    keyword: Optional[str] = None
    source: Optional[str] = None
    is_active: bool
    last_triggered_at: Optional[datetime] = None
    created_at: datetime


class AlertListResponse(BaseModel):
    alerts: List[AlertResponse]
    total: int


class AlertEvaluationResult(BaseModel):
    alert_id: int
    alert_type: str
    triggered: bool
    message: str
    is_active: bool = True


class AlertEvaluationResponse(BaseModel):
    project_id: int
    evaluated: int
    triggered: int
    results: List[AlertEvaluationResult]
