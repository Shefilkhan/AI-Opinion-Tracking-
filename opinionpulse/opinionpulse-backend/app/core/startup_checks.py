import logging

from app.core.config import get_settings

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
            "APP_ENV": s.app_env,
        },
    )
