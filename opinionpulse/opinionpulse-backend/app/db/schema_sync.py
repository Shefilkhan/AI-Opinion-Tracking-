"""Align legacy MySQL tables with current SQLAlchemy models (XAMPP dev)."""

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def ensure_users_schema(engine: Engine) -> None:
    """Add/migrate users columns from older OpinionPulse auth schema."""
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    columns = {col["name"] for col in inspector.get_columns("users")}

    with engine.begin() as conn:
        if "name" not in columns:
            conn.execute(
                text(
                    "ALTER TABLE users ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT ''"
                )
            )
            if "full_name" in columns:
                conn.execute(
                    text(
                        "UPDATE users SET name = full_name "
                        "WHERE name = '' OR name IS NULL"
                    )
                )
            conn.execute(
                text("UPDATE users SET name = 'User' WHERE name = '' OR name IS NULL")
            )

        if "password_hash" not in columns:
            conn.execute(
                text(
                    "ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) "
                    "NOT NULL DEFAULT ''"
                )
            )
            if "hashed_password" in columns:
                conn.execute(
                    text(
                        "UPDATE users SET password_hash = hashed_password "
                        "WHERE password_hash = '' OR password_hash IS NULL"
                    )
                )

        if "role" not in columns:
            conn.execute(
                text(
                    "ALTER TABLE users ADD COLUMN role VARCHAR(50) "
                    "NOT NULL DEFAULT 'user'"
                )
            )

        columns = {col["name"] for col in inspector.get_columns("users")}

        if "is_email_verified" not in columns:
            conn.execute(
                text(
                    "ALTER TABLE users ADD COLUMN is_email_verified TINYINT(1) "
                    "NOT NULL DEFAULT 0"
                )
            )
            conn.execute(text("UPDATE users SET is_email_verified = 1"))

        if "last_login_at" not in columns:
            conn.execute(
                text("ALTER TABLE users ADD COLUMN last_login_at DATETIME NULL")
            )

        if "updated_at" not in columns:
            conn.execute(
                text(
                    "ALTER TABLE users ADD COLUMN updated_at DATETIME "
                    "NULL DEFAULT CURRENT_TIMESTAMP"
                )
            )

        columns = {col["name"] for col in inspector.get_columns("users")}

        if "avatar_url" not in columns:
            conn.execute(
                text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(512) NULL")
            )
        if "is_active" not in columns:
            conn.execute(
                text(
                    "ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1"
                )
            )
        if "failed_login_attempts" not in columns:
            conn.execute(
                text(
                    "ALTER TABLE users ADD COLUMN failed_login_attempts INT "
                    "NOT NULL DEFAULT 0"
                )
            )
        if "lock_until" not in columns:
            conn.execute(
                text("ALTER TABLE users ADD COLUMN lock_until DATETIME NULL")
            )

        columns = {col["name"] for col in inspector.get_columns("users")}

        if "username" not in columns:
            conn.execute(
                text("ALTER TABLE users ADD COLUMN username VARCHAR(30) NULL")
            )
        if "bio" not in columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN bio TEXT NULL"))
        if "google_id" not in columns:
            conn.execute(
                text(
                    "ALTER TABLE users ADD COLUMN google_id VARCHAR(255) NULL UNIQUE"
                )
            )

        columns = {col["name"] for col in inspector.get_columns("users")}

        subscription_cols = {
            "plan_id": "VARCHAR(20) NOT NULL DEFAULT 'starter'",
            "plan_status": "VARCHAR(20) NOT NULL DEFAULT 'active'",
            "plan_started_at": "TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP",
            "plan_renews_at": "TIMESTAMP NULL",
            "trial_ends_at": "TIMESTAMP NULL",
            "stripe_customer_id": "VARCHAR(255) NULL",
            "stripe_subscription_id": "VARCHAR(255) NULL",
        }
        for col_name, col_def in subscription_cols.items():
            if col_name not in columns:
                conn.execute(
                    text(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}")
                )


def ensure_plans_schema(engine: Engine) -> None:
    """Create plans + usage_tracking tables if missing (legacy DBs)."""
    inspector = inspect(engine)
    table_names = inspector.get_table_names()

    with engine.begin() as conn:
        if "plans" not in table_names:
            conn.execute(
                text(
                    """
                    CREATE TABLE plans (
                        id VARCHAR(20) PRIMARY KEY,
                        name VARCHAR(50) NOT NULL,
                        price_monthly_cents INT NOT NULL,
                        searches_per_month INT NOT NULL,
                        data_sources_json JSON NOT NULL,
                        search_history_days INT NOT NULL,
                        csv_export_max_rows INT NOT NULL,
                        ai_opinion_summary TINYINT(1) DEFAULT 0,
                        ai_debate_analysis TINYINT(1) DEFAULT 0,
                        ai_trend_prediction TINYINT(1) DEFAULT 0,
                        realtime_alerts_max INT DEFAULT 0,
                        chat_messages_per_day INT NOT NULL,
                        chat_history_days INT NOT NULL,
                        api_access TINYINT(1) DEFAULT 0,
                        team_members_max INT DEFAULT 1,
                        sso_enabled TINYINT(1) DEFAULT 0,
                        support_tier VARCHAR(30) DEFAULT 'email',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                    """
                )
            )

        if "usage_tracking" not in table_names:
            conn.execute(
                text(
                    """
                    CREATE TABLE usage_tracking (
                        id VARCHAR(36) PRIMARY KEY,
                        user_id INT NOT NULL,
                        period_start DATE NOT NULL,
                        period_end DATE NOT NULL,
                        searches_used INT DEFAULT 0,
                        chat_messages_used_today INT DEFAULT 0,
                        chat_messages_today_date DATE NULL,
                        csv_exports_used INT DEFAULT 0,
                        ai_summary_calls INT DEFAULT 0,
                        ai_debate_calls INT DEFAULT 0,
                        ai_trend_calls INT DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,
                        UNIQUE KEY uniq_user_period (user_id, period_start),
                        CONSTRAINT fk_usage_user
                            FOREIGN KEY (user_id) REFERENCES users(id)
                            ON DELETE CASCADE
                    )
                    """
                )
            )


REQUIRED_CHAT_COLUMNS = {
    "id",
    "user_id",
    "conversation_id",
    "role",
    "content",
    "metadata_json",
    "created_at",
}


def ensure_chat_messages_schema(engine: Engine) -> None:
    """Drop and recreate chat_messages if schema is missing required columns."""
    inspector = inspect(engine)
    table_names = inspector.get_table_names()

    if "chat_messages" in table_names:
        columns = {col["name"] for col in inspector.get_columns("chat_messages")}
        if REQUIRED_CHAT_COLUMNS.issubset(columns):
            return

    with engine.begin() as conn:
        conn.execute(text("DROP TABLE IF EXISTS chat_messages"))
        conn.execute(
            text(
                """
                CREATE TABLE chat_messages (
                    id VARCHAR(36) PRIMARY KEY,
                    user_id INT NOT NULL,
                    conversation_id VARCHAR(64) NOT NULL,
                    role VARCHAR(20) NOT NULL,
                    content TEXT NOT NULL,
                    metadata_json JSON NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_user_conv (user_id, conversation_id),
                    INDEX idx_user_id (user_id),
                    INDEX idx_conversation_id (conversation_id),
                    INDEX idx_created (created_at),
                    CONSTRAINT fk_chat_messages_user
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
                """
            )
        )
