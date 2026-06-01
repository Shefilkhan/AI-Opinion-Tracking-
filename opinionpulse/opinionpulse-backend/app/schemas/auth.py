import re
from typing import Literal, Optional, Union

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

from app.schemas.otp import LoginPendingResponse, RegisterPendingResponse
from app.schemas.user import UserResponse

PASSWORD_PATTERN = re.compile(
    r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>/?]).{8,128}$"
)


class RegisterRequest(BaseModel):
    name: Optional[str] = Field(default=None, max_length=50)
    full_name: Optional[str] = Field(default=None, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @model_validator(mode="after")
    def resolve_name(self):
        resolved = (self.full_name or self.name or "").strip()
        if len(resolved) < 2:
            raise ValueError("Full name must be at least 2 characters.")
        if not re.match(r"^[a-zA-Z\s\-']+$", resolved):
            raise ValueError("Full name may only contain letters and spaces.")
        object.__setattr__(self, "name", resolved)
        return self

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, v: str) -> str:
        return v.lower().strip()

    @field_validator("password")
    @classmethod
    def strong_password(cls, v: str) -> str:
        if not PASSWORD_PATTERN.match(v):
            raise ValueError(
                "Password must be 8+ chars with uppercase, number, and special character."
            )
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, v: str) -> str:
        return v.lower().strip()


class ForgotPasswordRequest(BaseModel):
    email: EmailStr

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, v: str) -> str:
        return v.lower().strip()


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp_code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def strong_password(cls, v: str) -> str:
        if not PASSWORD_PATTERN.match(v):
            raise ValueError(
                "Password must be 8+ chars with uppercase, number, and special character."
            )
        return v


class TokenResponse(BaseModel):
    success: bool = True
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class AuthSuccessResponse(BaseModel):
    success: bool = True
    message: str


class ForgotPasswordResponse(BaseModel):
    success: bool = True
    message: str
    dev_otp_code: Optional[str] = None


class LoginErrorResponse(BaseModel):
    detail: str
    attempts_remaining: Optional[int] = None
    locked_until: Optional[str] = None


OtpTypeLiteral = Literal[
    "signup",
    "login",
    "password_reset",
    "SIGNUP_VERIFY",
    "LOGIN_VERIFY",
    "PASSWORD_RESET",
]


RegisterResponse = Union[RegisterPendingResponse, TokenResponse]
LoginResponse = Union[LoginPendingResponse, TokenResponse]
