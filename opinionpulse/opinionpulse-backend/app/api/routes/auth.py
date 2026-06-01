from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.database import get_db
from app.db.models import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.otp import (
    LoginPendingResponse,
    OtpEmailRequest,
    OtpSuccessResponse,
    RegisterPendingResponse,
    ResendOtpResponse,
    VerifyOtpRequest,
)
from app.schemas.user import UserResponse
from app.services import otp_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _build_token_response(user: User) -> TokenResponse:
    access_token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/register",
    response_model=RegisterPendingResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    payload: RegisterRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    email_lower = payload.email.lower()
    existing = db.query(User).filter(User.email == email_lower).first()
    if existing:
        if existing.is_email_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists",
            )
        existing.name = payload.name.strip()
        existing.password_hash = hash_password(payload.password)
        db.commit()
        db.refresh(existing)
        user = existing
    else:
        user = User(
            name=payload.name.strip(),
            email=email_lower,
            password_hash=hash_password(payload.password),
            role="user",
            is_email_verified=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    plain_otp = otp_service.create_email_otp(
        db, user, "register_verification", background_tasks
    )
    return RegisterPendingResponse(
        message="Account created. Please verify the OTP sent to your email.",
        email=user.email,
        requires_otp=True,
        dev_otp_code=otp_service.dev_otp_payload(plain_otp),
    )


@router.post("/verify-register-otp", response_model=OtpSuccessResponse)
def verify_register_otp(payload: VerifyOtpRequest, db: Session = Depends(get_db)):
    user = otp_service.verify_email_otp(
        db, payload.email, payload.otp_code, "register_verification"
    )
    user.is_email_verified = True
    db.commit()
    return OtpSuccessResponse(
        message="Email verified successfully. Please login.",
        verified=True,
    )


@router.post("/resend-register-otp", response_model=ResendOtpResponse)
def resend_register_otp(
    payload: OtpEmailRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found for this email.",
        )
    if user.is_email_verified:
        return ResendOtpResponse(
            message="Email is already verified. Please login.",
            dev_otp_code=None,
        )
    plain_otp = otp_service.create_email_otp(
        db, user, "register_verification", background_tasks
    )
    return ResendOtpResponse(
        message="A new verification code has been sent to your email.",
        dev_otp_code=otp_service.dev_otp_payload(plain_otp),
    )


@router.post("/login", response_model=LoginPendingResponse)
def login(
    payload: LoginRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_email_verified:
        plain_otp = otp_service.create_email_otp(
            db, user, "register_verification", background_tasks
        )
        return LoginPendingResponse(
            message="Please verify your email first. A new OTP has been sent.",
            email=user.email,
            requires_email_verification=True,
            requires_login_otp=False,
            dev_otp_code=otp_service.dev_otp_payload(plain_otp),
        )

    plain_otp = otp_service.create_email_otp(
        db, user, "login_verification", background_tasks
    )
    return LoginPendingResponse(
        message="Login OTP sent to your email.",
        email=user.email,
        requires_login_otp=True,
        requires_email_verification=False,
        dev_otp_code=otp_service.dev_otp_payload(plain_otp),
    )


@router.post("/verify-login-otp", response_model=TokenResponse)
def verify_login_otp(payload: VerifyOtpRequest, db: Session = Depends(get_db)):
    user = otp_service.verify_email_otp(
        db, payload.email, payload.otp_code, "login_verification"
    )
    if not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is not verified.",
        )
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return _build_token_response(user)


@router.post("/resend-login-otp", response_model=ResendOtpResponse)
def resend_login_otp(
    payload: OtpEmailRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found for this email.",
        )
    if not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please verify your email first.",
        )
    plain_otp = otp_service.create_email_otp(
        db, user, "login_verification", background_tasks
    )
    return ResendOtpResponse(
        message="A new login code has been sent to your email.",
        dev_otp_code=otp_service.dev_otp_payload(plain_otp),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}
