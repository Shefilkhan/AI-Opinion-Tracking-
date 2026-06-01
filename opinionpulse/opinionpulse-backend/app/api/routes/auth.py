from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.auth_cookies import clear_auth_cookie, set_auth_cookie
from app.core.otp_types import normalize_otp_type
from app.core.security import hash_password, verify_password
from app.db.database import get_db
from app.db.models import User
from app.schemas.auth import (
    AuthSuccessResponse,
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.schemas.otp import (
    LoginPendingResponse,
    OtpEmailRequest,
    RegisterPendingResponse,
    ResendOtpRequest,
    ResendOtpResponse,
    VerifyOtpRequest,
)
from app.schemas.user import UserResponse
from app.services import otp_service
from app.services.auth_log_service import log_auth_event
from app.services.auth_rate_limit import rate_limit_by_email, rate_limit_by_ip
from app.services.session_service import create_user_session, revoke_token_session
from app.api.deps import extract_request_token
from app.core.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/api/auth", tags=["auth"])


def _build_token_response(
    user: User, request: Request, db: Session
) -> TokenResponse:
    token = create_user_session(db, user, request)
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


def _set_token_on_response(
    response: Response, token_response: TokenResponse
) -> TokenResponse:
    set_auth_cookie(response, token_response.access_token)
    return token_response


def _check_account_lock(user: User) -> None:
    if user.lock_until is None:
        return
    lock = user.lock_until
    if lock.tzinfo is None:
        lock = lock.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) < lock:
        remaining = int((lock - datetime.now(timezone.utc)).total_seconds())
        minutes = remaining // 60
        seconds = remaining % 60
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Account locked. Try again in {minutes}:{seconds:02d}",
        )
    user.lock_until = None
    user.failed_login_attempts = 0


def _register_handler(
    payload: RegisterRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session,
):
    rate_limit_by_ip(request, "signup", 5, 3600)
    email_lower = payload.email
    existing = db.query(User).filter(User.email == email_lower).first()
    if existing and existing.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    if existing:
        existing.name = payload.name
        existing.password_hash = hash_password(payload.password)
        db.commit()
        db.refresh(existing)
        user = existing
    else:
        user = User(
            name=payload.name,
            email=email_lower,
            password_hash=hash_password(payload.password),
            role="user",
            is_email_verified=False,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    plain_otp = otp_service.create_email_otp(
        db, user, "register_verification", background_tasks
    )
    log_auth_event("signup", email=user.email, user_id=user.id, request=request)
    return RegisterPendingResponse(
        success=True,
        message="OTP sent to email",
        email=user.email,
        requires_otp=True,
        dev_otp_code=otp_service.dev_otp_payload(plain_otp),
    )


def _login_handler(
    payload: LoginRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session,
):
    rate_limit_by_ip(request, "signin", 10, 900)
    email_lower = payload.email
    user = db.query(User).filter(User.email == email_lower).first()

    if user is None:
        log_auth_event("signin_failed", email=email_lower, request=request)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    _check_account_lock(user)

    if not verify_password(payload.password, user.password_hash):
        user.failed_login_attempts += 1
        remaining = max(
            0,
            settings.login_max_failed_attempts - user.failed_login_attempts,
        )
        if user.failed_login_attempts >= settings.login_max_failed_attempts:
            user.lock_until = datetime.now(timezone.utc) + timedelta(
                minutes=settings.login_lockout_minutes
            )
            db.commit()
            log_auth_event("signin_locked", email=email_lower, user_id=user.id, request=request)
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="Account locked due to too many failed attempts.",
            )
        db.commit()
        log_auth_event("signin_failed", email=email_lower, user_id=user.id, request=request)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid email or password. {remaining} attempts remaining.",
        )

    user.failed_login_attempts = 0
    user.lock_until = None
    db.commit()

    if not user.is_email_verified:
        plain_otp = otp_service.create_email_otp(
            db, user, "register_verification", background_tasks
        )
        log_auth_event("signin_unverified", email=user.email, user_id=user.id, request=request)
        return LoginPendingResponse(
            message="Please verify your email. A new code has been sent.",
            email=user.email,
            requires_email_verification=True,
            requires_login_otp=False,
            dev_otp_code=otp_service.dev_otp_payload(plain_otp),
        )

    plain_otp = otp_service.create_email_otp(
        db, user, "login_verification", background_tasks
    )
    log_auth_event("signin_otp_sent", email=user.email, user_id=user.id, request=request)
    return LoginPendingResponse(
        message="OTP sent",
        email=user.email,
        requires_login_otp=True,
        requires_email_verification=False,
        dev_otp_code=otp_service.dev_otp_payload(plain_otp),
    )


def _verify_otp_handler(
    payload: VerifyOtpRequest,
    request: Request,
    db: Session,
    response: Response,
    purpose: str,
):
    rate_limit_by_ip(request, "verify-otp", 10, 3600)
    user = otp_service.verify_email_otp(
        db, payload.email, payload.resolved_code, purpose
    )

    if purpose == "register_verification":
        user.is_email_verified = True

    if purpose in ("login_verification", "register_verification"):
        user.last_login_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(user)

    token_response = _build_token_response(user, request, db)
    log_auth_event(
        "otp_verified",
        email=user.email,
        user_id=user.id,
        request=request,
        extra=f"purpose={purpose}",
    )
    _set_token_on_response(response, token_response)
    return token_response


@router.post(
    "/register",
    response_model=RegisterPendingResponse,
    status_code=status.HTTP_201_CREATED,
)
@router.post(
    "/signup",
    response_model=RegisterPendingResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    payload: RegisterRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
):
    return _register_handler(payload, background_tasks, request, db)


@router.post("/login", response_model=LoginPendingResponse)
@router.post("/signin", response_model=LoginPendingResponse)
def login(
    payload: LoginRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
):
    return _login_handler(payload, background_tasks, request, db)


@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(
    payload: VerifyOtpRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    if not payload.type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP type is required (signup, login, or password_reset).",
        )
    try:
        purpose = normalize_otp_type(payload.type)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return _verify_otp_handler(payload, request, db, response, purpose)


@router.post("/verify-register-otp", response_model=TokenResponse)
def verify_register_otp(
    payload: VerifyOtpRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    return _verify_otp_handler(
        payload, request, db, response, "register_verification"
    )


@router.post("/verify-login-otp", response_model=TokenResponse)
def verify_login_otp(
    payload: VerifyOtpRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    return _verify_otp_handler(
        payload, request, db, response, "login_verification"
    )


@router.post("/resend-otp", response_model=ResendOtpResponse)
def resend_otp(
    payload: ResendOtpRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
):
    rate_limit_by_email(
        payload.email,
        "resend-otp",
        settings.otp_resend_max_per_window,
        settings.otp_resend_window_minutes * 60,
    )
    if not payload.type:
        raise HTTPException(status_code=400, detail="OTP type is required.")
    try:
        purpose = normalize_otp_type(payload.type)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if user is None:
        raise HTTPException(status_code=404, detail="No account found for this email.")

    plain_otp = otp_service.create_email_otp(db, user, purpose, background_tasks)
    log_auth_event("otp_resent", email=user.email, user_id=user.id, request=request)
    return ResendOtpResponse(
        success=True,
        message="A new code has been sent",
        dev_otp_code=otp_service.dev_otp_payload(plain_otp),
    )


@router.post("/resend-register-otp", response_model=ResendOtpResponse)
def resend_register_otp(
    payload: OtpEmailRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
):
    return resend_otp(
        ResendOtpRequest(email=payload.email, type="signup"),
        background_tasks,
        request,
        db,
    )


@router.post("/resend-login-otp", response_model=ResendOtpResponse)
def resend_login_otp(
    payload: OtpEmailRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
):
    return resend_otp(
        ResendOtpRequest(email=payload.email, type="login"),
        background_tasks,
        request,
        db,
    )


@router.post("/forgot-password", response_model=AuthSuccessResponse)
def forgot_password(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
):
    rate_limit_by_ip(request, "forgot-password", 5, 3600)
    user = db.query(User).filter(User.email == payload.email).first()
    if user is not None:
        otp_service.create_email_otp(db, user, "password_reset", background_tasks)
        log_auth_event("password_reset_requested", email=payload.email, request=request)
    return AuthSuccessResponse(
        success=True,
        message="If an account exists, a reset code has been sent.",
    )


@router.post("/reset-password", response_model=AuthSuccessResponse)
def reset_password(
    payload: ResetPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    user = otp_service.verify_email_otp(
        db, payload.email, payload.otp_code, "password_reset"
    )
    user.password_hash = hash_password(payload.new_password)
    user.failed_login_attempts = 0
    user.lock_until = None
    db.commit()
    log_auth_event("password_reset", email=user.email, user_id=user.id, request=request)
    return AuthSuccessResponse(success=True, message="Password updated successfully.")


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.post("/logout", response_model=AuthSuccessResponse)
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    token = extract_request_token(request, None)
    if token:
        revoke_token_session(db, token)
    clear_auth_cookie(response)
    log_auth_event("logout", request=request)
    return AuthSuccessResponse(success=True, message="Logged out successfully")
