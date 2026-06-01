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
