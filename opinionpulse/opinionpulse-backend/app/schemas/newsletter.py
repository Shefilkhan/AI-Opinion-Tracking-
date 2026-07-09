from pydantic import BaseModel, EmailStr, Field, field_validator


class NewsletterJoinRequest(BaseModel):
    email: EmailStr = Field(..., max_length=255)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.lower().strip()


class NewsletterJoinResponse(BaseModel):
    success: bool = True
    message: str
    email: str
    email_sent: bool = False
