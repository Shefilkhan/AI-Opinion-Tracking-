from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class OtpEmailRequest(BaseModel):
    email: EmailStr

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, v: str) -> str:
        return v.lower().strip()


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp_code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")
    code: Optional[str] = Field(default=None, min_length=6, max_length=6)
    type: Optional[str] = None

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, v: str) -> str:
        return v.lower().strip()

    @property
    def resolved_code(self) -> str:
        return (self.code or self.otp_code).strip()


class ResendOtpRequest(BaseModel):
    email: EmailStr
    type: Optional[str] = None

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, v: str) -> str:
        return v.lower().strip()


class RegisterPendingResponse(BaseModel):
    success: bool = True
    message: str
    email: EmailStr
    requires_otp: bool = True
    dev_otp_code: Optional[str] = None


class LoginPendingResponse(BaseModel):
    message: str
    email: EmailStr
    requires_login_otp: bool = False
    requires_email_verification: bool = False
    dev_otp_code: Optional[str] = None


class ResendOtpResponse(BaseModel):
    success: bool = True
    message: str
    dev_otp_code: Optional[str] = None


class OtpSuccessResponse(BaseModel):
    message: str
    verified: bool = True
