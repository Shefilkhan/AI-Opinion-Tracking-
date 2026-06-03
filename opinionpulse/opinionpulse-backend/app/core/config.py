from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "OpinionPulse"
    app_env: str = "development"

    db_host: str = "localhost"
    db_port: int = 3306
    db_user: str = "root"
    db_password: str = ""
    db_name: str = "opinionpulse_db"

    secret_key: str = "change_this_secret_key_later"
    otp_secret: str = "change_this_otp_pepper_secret"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080  # 7 days
    access_token_expire_days: int = 7
    bcrypt_rounds: int = 12
    frontend_url: str = "http://localhost:5173"
    auth_cookie_name: str = "opinionpulse_token"
    auth_cookie_secure: bool = False

    youtube_api_key: str = ""
    youtube_max_videos_per_keyword: int = 3
    youtube_max_comments_per_video: int = 20

    reddit_client_id: str = ""
    reddit_client_secret: str = ""
    reddit_username: str = ""
    reddit_password: str = ""
    reddit_user_agent: str = "OpinionPulse/1.0"
    reddit_max_posts_per_keyword: int = 10
    reddit_max_comments_per_post: int = 10

    news_api_key: str = ""
    guardian_api_key: str = ""
    mediastack_api_key: str = ""
    currents_api_key: str = ""
    gnews_api_key: str = ""
    openai_api_key: str = ""
    cache_duration_seconds: int = 300

    email_provider: str = "smtp"
    # Preferred names (Gmail); also accepts SMTP_USER / SMTP_PASSWORD
    email_user: str = ""
    email_app_password: str = ""
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_name: str = "OpinionPulse"
    smtp_from_email: str = ""

    @model_validator(mode="after")
    def apply_email_env_aliases(self):
        """Map EMAIL_USER / EMAIL_APP_PASSWORD to SMTP settings (Gmail)."""
        user = (self.email_user or self.smtp_user or "").strip()
        password = (
            (self.email_app_password or self.smtp_password or "")
            .replace(" ", "")
            .strip()
        )
        host = (self.smtp_host or "smtp.gmail.com").strip() or "smtp.gmail.com"
        object.__setattr__(self, "smtp_user", user)
        object.__setattr__(self, "smtp_password", password)
        object.__setattr__(self, "smtp_host", host)
        if user and not (self.smtp_from_email or "").strip():
            object.__setattr__(self, "smtp_from_email", user)
        return self

    otp_expire_minutes: int = 2
    otp_max_attempts: int = 3
    otp_resend_max_per_window: int = 3
    otp_resend_window_minutes: int = 10
    login_max_failed_attempts: int = 5
    login_lockout_minutes: int = 15

    @property
    def email_configured(self) -> bool:
        return bool(self.smtp_user and self.smtp_password)

    @property
    def expose_dev_otp_in_api(self) -> bool:
        """Return OTP in API when SMTP is missing (local dev only)."""
        return self.app_env == "development" and not self.email_configured

    @property
    def database_url(self) -> str:
        password = self.db_password
        auth = f"{self.db_user}:{password}" if password else f"{self.db_user}:"
        return (
            f"mysql+pymysql://{auth}@{self.db_host}:{self.db_port}/{self.db_name}"
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
