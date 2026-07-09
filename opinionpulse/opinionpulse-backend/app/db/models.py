from datetime import date, datetime
from typing import Optional
import uuid

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    Float,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


def _uuid_str() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    username: Mapped[Optional[str]] = mapped_column(
        String(30), unique=True, nullable=True, index=True
    )
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="user", nullable=False)
    is_email_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    last_login_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    avatar_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    google_id: Mapped[Optional[str]] = mapped_column(
        String(255), unique=True, nullable=True, index=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    failed_login_attempts: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    lock_until: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    plan_id: Mapped[str] = mapped_column(
        String(20), ForeignKey("plans.id"), default="starter", nullable=False
    )
    plan_status: Mapped[str] = mapped_column(
        String(20), default="active", nullable=False
    )
    plan_started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    plan_renews_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    trial_ends_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    stripe_subscription_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    plan: Mapped["Plan"] = relationship(back_populates="users")
    usage_records: Mapped[list["UsageTracking"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    email_otps: Mapped[list["EmailOTP"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    auth_sessions: Mapped[list["AuthSession"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    search_history: Mapped[list["SearchHistory"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    saved_searches: Mapped[list["SavedSearch"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    pulse_chat_messages: Mapped[list["PulseChatMessage"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class Plan(Base):
    __tablename__ = "plans"

    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    price_monthly_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    searches_per_month: Mapped[int] = mapped_column(Integer, nullable=False)
    data_sources_json: Mapped[object] = mapped_column(JSON, nullable=False)
    search_history_days: Mapped[int] = mapped_column(Integer, nullable=False)
    csv_export_max_rows: Mapped[int] = mapped_column(Integer, nullable=False)
    ai_opinion_summary: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    ai_debate_analysis: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    ai_trend_prediction: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    realtime_alerts_max: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    chat_messages_per_day: Mapped[int] = mapped_column(Integer, nullable=False)
    chat_history_days: Mapped[int] = mapped_column(Integer, nullable=False)
    api_access: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    team_members_max: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    sso_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    support_tier: Mapped[str] = mapped_column(
        String(30), default="email", nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    users: Mapped[list["User"]] = relationship(back_populates="plan")


class UsageTracking(Base):
    __tablename__ = "usage_tracking"
    __table_args__ = (UniqueConstraint("user_id", "period_start", name="uniq_user_period"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    searches_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    chat_messages_used_today: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    chat_messages_today_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    csv_exports_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ai_summary_calls: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ai_debate_calls: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ai_trend_calls: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user: Mapped["User"] = relationship(back_populates="usage_records")


class EmailOTP(Base):
    __tablename__ = "email_otps"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    otp_code_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    purpose: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    attempt_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    used_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    user: Mapped["User"] = relationship(back_populates="email_otps")


class AuthSession(Base):
    __tablename__ = "auth_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    token_hash: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    ip_address: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="auth_sessions")


class SearchHistory(Base):
    __tablename__ = "search_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    query: Mapped[str] = mapped_column(String(100), nullable=False)
    results_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    sentiment_positive: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    sentiment_negative: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    sentiment_neutral: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    searched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="search_history")


class SavedSearch(Base):
    __tablename__ = "saved_searches"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    query: Mapped[str] = mapped_column(String(100), nullable=False)
    filters_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    alert_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="saved_searches")


class PulseChatMessage(Base):
    __tablename__ = "chat_messages"
    __table_args__ = (
        Index("idx_user_conv", "user_id", "conversation_id"),
        Index("idx_created", "created_at"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    conversation_id: Mapped[str] = mapped_column(
        String(64), nullable=False, index=True
    )
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="pulse_chat_messages")

class Mention(Base):
    __tablename__ = "mentions"
    __table_args__ = (
        Index("idx_search_query_fetched", "search_query", "fetched_at"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    search_query: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    platform: Mapped[str] = mapped_column(String(50), nullable=False)
    author: Mapped[str] = mapped_column(String(255), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    source_url: Mapped[str] = mapped_column(String(512), nullable=True)
    sentiment: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    sentiment_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    media_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    severity_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    demographics: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    social_media_usage_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    risk_assessment: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    comparative_risk_reasoning: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    posted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class PersonRiskProfile(Base):
    """
    Aggregate risk profile for a subject (person/handle) computed from many
    item-level analyses. Schema-ready for Phase 2 — no API route in Phase 1.
    """

    __tablename__ = "person_risk_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    # The analyst (logged-in user who ran the analysis)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # The subject being analysed (Twitter handle, name, etc.)
    subject_handle: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    # Aggregation stats
    item_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    hours_on_social_media: Mapped[float] = mapped_column(
        Float, default=3.0, nullable=False
    )
    dominant_content_type: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    avg_composite_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    peak_risk_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    aggregate_risk_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    # Full JSON array of ItemRiskAnalysis dicts for audit trail
    items_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    assessed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class NewsletterSubscriber(Base):
    __tablename__ = "newsletter_subscribers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    subscribed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
