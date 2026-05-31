from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
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
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

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
