from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.db.models import User


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    full_name: str = ""
    email: EmailStr
    role: str
    is_email_verified: bool = False
    avatar_url: Optional[str] = None
    username: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime
    last_login_at: Optional[datetime] = None


def user_to_response(user: User) -> UserResponse:
    role = (user.role or "user").upper()
    return UserResponse(
        id=user.id,
        name=user.name,
        full_name=user.name,
        email=user.email,
        role=role,
        is_email_verified=bool(user.is_email_verified),
        avatar_url=user.avatar_url,
        username=user.username,
        bio=user.bio,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
    )
