import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine, text

from app.api.routes import (
    account,
    alerts,
    analytics,
    auth,
    chat,
    collection,
    dashboard,
    reports,
    health,
    keywords,
    mentions,
    projects,
    sentiment,
    settings as settings_routes,
    sources,
)
from app.core.config import get_settings
from app.core.startup_checks import log_env_check
from app.db import models  # noqa: F401 — register models with metadata
from app.db.database import Base, engine
from app.db.schema_sync import ensure_users_schema

logger = logging.getLogger(__name__)
settings = get_settings()


def ensure_database_exists() -> None:
    """Create opinionpulse_db if missing (XAMPP dev convenience)."""
    password = settings.db_password
    auth = f"{settings.db_user}:{password}" if password else f"{settings.db_user}:"
    server_url = (
        f"mysql+pymysql://{auth}@{settings.db_host}:{settings.db_port}/"
    )
    server_engine = create_engine(server_url, isolation_level="AUTOCOMMIT")
    with server_engine.connect() as connection:
        connection.execute(
            text(
                f"CREATE DATABASE IF NOT EXISTS `{settings.db_name}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
        )
    server_engine.dispose()


@asynccontextmanager
async def lifespan(app: FastAPI):
    log_env_check()
    if settings.app_env == "development":
        ensure_database_exists()
        Base.metadata.create_all(bind=engine)
        ensure_users_schema(engine)
    yield


app = FastAPI(
    title=settings.app_name,
    description="OpinionPulse API — opinion tracking and sentiment analysis",
    version="0.1.0",
    lifespan=lifespan,
)

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    detail = (
        str(exc)
        if settings.app_env == "development"
        else "Something went wrong. Please try again."
    )
    return JSONResponse(status_code=500, content={"detail": detail})


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(account.router)
app.include_router(dashboard.router)
app.include_router(settings_routes.router)
app.include_router(projects.router)
app.include_router(keywords.router)
app.include_router(sources.router)
app.include_router(mentions.router)
app.include_router(sentiment.router)
app.include_router(analytics.router)
app.include_router(collection.router)
app.include_router(chat.router)
app.include_router(reports.router)
app.include_router(alerts.router)


@app.get("/")
def root():
    return {
        "app": settings.app_name,
        "docs": "/docs",
        "health": "/api/health",
    }
