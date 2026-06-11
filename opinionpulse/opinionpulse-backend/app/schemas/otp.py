from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class OtpEmailRequest(BaseModel):
    email: EmailStr


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp_code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")
    code: Optional[str] = Field(default=None, min_length=6, max_length=6)
    type: Optional[str] = None

    @property
    def resolved_code(self) -> str:
        return (self.code or self.otp_code).strip()


class ResendOtpRequest(BaseModel):
    email: EmailStr
    type: Optional[str] = None


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
