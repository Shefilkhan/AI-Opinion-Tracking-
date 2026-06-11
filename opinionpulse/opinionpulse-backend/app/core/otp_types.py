"""Map API OTP type enums to internal purpose strings."""

from typing import Literal

OtpType = Literal[
    "signup",
    "login",
    "password_reset",
    "SIGNUP_VERIFY",
    "LOGIN_VERIFY",
    "PASSWORD_RESET",
]

TYPE_TO_PURPOSE = {
    "signup": "register_verification",
    "SIGNUP_VERIFY": "register_verification",
    "login": "login_verification",
    "LOGIN_VERIFY": "login_verification",
    "password_reset": "password_reset",
    "PASSWORD_RESET": "password_reset",
}


def normalize_otp_type(otp_type: str) -> str:
    key = otp_type.strip()
    purpose = TYPE_TO_PURPOSE.get(key) or TYPE_TO_PURPOSE.get(key.upper())
    if purpose is None:
        raise ValueError(f"Invalid OTP type: {otp_type}")
    return purpose
