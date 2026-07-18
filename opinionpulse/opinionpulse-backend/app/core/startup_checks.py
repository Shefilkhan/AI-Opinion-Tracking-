import logging

from app.core.config import get_settings
from app.services.google_oauth_service import is_google_oauth_configured

logger = logging.getLogger(__name__)


def log_env_check() -> None:
    """Log which critical settings are configured (FastAPI / MySQL stack)."""
    s = get_settings()
    logger.info(
        "ENV CHECK: %s",
        {
            "DATABASE_URL": bool(s.database_url),
            "DB_HOST": bool(s.db_host),
            "DB_NAME": bool(s.db_name),
            "SECRET_KEY": bool(s.secret_key)
            and s.secret_key != "change_this_secret_key_later",
            "OTP_SECRET": bool(s.otp_secret)
            and s.otp_secret != "change_this_otp_pepper_secret",
            "JWT_CONFIGURED": bool(s.secret_key),
            "EMAIL_USER": bool(s.email_user or s.smtp_user),
            "EMAIL_APP_PASSWORD": bool(s.email_app_password or s.smtp_password),
            "SMTP_HOST": s.smtp_host,
            "EMAIL_CONFIGURED": s.email_configured,
            "AI_PROVIDER": s.ai_provider,
            "GROQ_API_KEY": bool(s.groq_api_key.strip()),
            "ANTHROPIC_API_KEY": bool(s.anthropic_api_key.strip()),
            "QUIVER_API_KEY": bool(s.quiver_api_key.strip()),
            "GOOGLE_OAUTH": is_google_oauth_configured(),
            "APP_ENV": s.app_env,
        },
    )


_DEFAULT_SECRET_KEY = "change_this_secret_key_later"
_DEFAULT_OTP_SECRET = "change_this_otp_pepper_secret"


def verify_production_secrets() -> None:
    """Refuse to boot in production with placeholder security secrets.

    In development we only warn, so local onboarding stays frictionless; in
    production a default SECRET_KEY / OTP_SECRET (or a non-secure auth cookie)
    is a real vulnerability and must block startup.
    """
    s = get_settings()
    problems: list[str] = []
    if not s.secret_key or s.secret_key == _DEFAULT_SECRET_KEY:
        problems.append("SECRET_KEY is unset or still the placeholder default")
    if not s.otp_secret or s.otp_secret == _DEFAULT_OTP_SECRET:
        problems.append("OTP_SECRET is unset or still the placeholder default")
    if s.app_env == "production" and not s.auth_cookie_secure:
        problems.append("AUTH_COOKIE_SECURE should be true in production")

    if not problems:
        return

    message = "Insecure configuration: " + "; ".join(problems)
    if s.app_env == "production":
        raise RuntimeError(
            message + ". Refusing to start in production — set strong secrets."
        )
    logger.warning("%s (permitted in development only)", message)
