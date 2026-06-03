from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class AccountProfileResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    is_email_verified: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None


class AccountProfileUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class AccountPasswordUpdate(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)
    confirm_password: str = Field(min_length=6, max_length=128)


class AccountStatsResponse(BaseModel):
    total_searches: int
    total_results: int
    saved_searches: int
