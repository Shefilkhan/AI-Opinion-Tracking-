"""Brand & reputation monitor API schemas."""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


class BrandWatchCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    brand: str = Field(min_length=1, max_length=100)
    product: Optional[str] = Field(default=None, max_length=100)
    ceo: Optional[str] = Field(default=None, max_length=100)
    aliases: list[str] = Field(default_factory=list, max_length=10)
    threshold: int = Field(default=70, ge=1, le=100)
    frequency: Literal["instant", "daily"] = "daily"


class BrandWatchUpdate(BaseModel):
    enabled: Optional[bool] = None
    name: Optional[str] = None
    brand: Optional[str] = None
    product: Optional[str] = None
    ceo: Optional[str] = None
    aliases: Optional[list[str]] = None
    threshold: Optional[int] = Field(default=None, ge=1, le=100)
    frequency: Optional[Literal["instant", "daily"]] = None


class BrandWatchOut(BaseModel):
    id: str
    name: str
    brand: str
    product: Optional[str] = None
    ceo: Optional[str] = None
    aliases: list[str] = Field(default_factory=list)
    terms: list[str] = Field(default_factory=list)
    threshold: int
    frequency: str
    enabled: bool
    watch_type: str = "bundle"


class ResponseBriefOut(BaseModel):
    topic: str
    talking_points: list[str]
    risks: list[str]
    source_count: int
    sample_snippets: list[str] = Field(default_factory=list)
    ai_generated: bool = False


class AlertPreferencesOut(BaseModel):
    email_crisis: bool = True
    email_weekly_report: bool = False
    slack_crisis: bool = False
    slack_webhook_url: Optional[str] = None
    slack_configured: bool = False


class AlertPreferencesUpdate(BaseModel):
    email_crisis: Optional[bool] = None
    email_weekly_report: Optional[bool] = None
    slack_crisis: Optional[bool] = None
    slack_webhook_url: Optional[str] = None
