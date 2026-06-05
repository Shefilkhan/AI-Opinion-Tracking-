from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


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
    new_password: str = Field(min_length=6, max_length=128)
    confirm_password: str = Field(min_length=6, max_length=128)


class AccountStatsResponse(BaseModel):
    total_searches: int
    total_results: int
    saved_searches: int
    total_chats: int = 0
    member_since: Optional[datetime] = None
    last_active: Optional[datetime] = None
