from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class AccountProfileResponse(BaseModel):
    id: int
    name: str
    full_name: str = ""
    email: EmailStr
    role: str
    is_email_verified: bool
    avatar_url: Optional[str] = None
    username: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime
    last_login_at: Optional[datetime] = None


class AccountProfileUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    username: Optional[str] = Field(default=None, max_length=30)
    bio: Optional[str] = Field(default=None, max_length=160)


class AccountPasswordUpdate(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def strong_password(cls, v: str) -> str:
        # Same policy as signup/reset (schemas/auth.PASSWORD_PATTERN); imported
        # lazily to avoid any circular import between the schema modules.
        from app.schemas.auth import PASSWORD_PATTERN

        if not PASSWORD_PATTERN.match(v):
            raise ValueError(
                "Password must be 8+ chars with uppercase, lowercase, "
                "number, and special character."
            )
        return v


class AccountStatsResponse(BaseModel):
    total_searches: int
    total_results: int
    saved_searches: int
    total_chats: int = 0
    member_since: Optional[datetime] = None
    last_active: Optional[datetime] = None
