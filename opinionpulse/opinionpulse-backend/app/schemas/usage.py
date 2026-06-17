from typing import Any, Optional, Union

from pydantic import BaseModel


class UsageMetric(BaseModel):
    used: int
    limit: int
    percent: Optional[int] = None


class UsagePeriod(BaseModel):
    start: str
    end: str


class UsagePlanInfo(BaseModel):
    id: str
    name: str
    status: str


class UsageFeatures(BaseModel):
    data_sources: Union[list[str], str]
    ai_opinion_summary: bool
    ai_debate_analysis: bool
    ai_trend_prediction: bool
    api_access: bool
    search_history_days: int
    chat_history_days: int


class UsageStatusResponse(BaseModel):
    plan: UsagePlanInfo
    usage: dict[str, Any]
    period: UsagePeriod
    features: UsageFeatures


class AdminSetPlanRequest(BaseModel):
    user_id: int
    plan_id: str
