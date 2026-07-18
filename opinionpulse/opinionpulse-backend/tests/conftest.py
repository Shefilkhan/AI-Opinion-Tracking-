"""Pytest fixtures: in-memory SQLite so the app is testable without MySQL."""
from __future__ import annotations

import os
import pathlib
import sys
from contextlib import asynccontextmanager

BACKEND = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))
os.environ.setdefault("APP_ENV", "development")

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.database import Base, get_db
from app.db import models  # noqa: F401 — register models on the metadata


def _make_engine():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    return engine


@pytest.fixture(autouse=True)
def _reset_rate_limiter():
    """Auth rate-limit buckets are process-global; clear them between tests."""
    from app.services import auth_rate_limit

    auth_rate_limit._buckets.clear()
    yield
    auth_rate_limit._buckets.clear()


@pytest.fixture()
def SessionLocal():
    engine = _make_engine()
    factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    # Seed plans once so plan-limit code has data.
    from app.services.plan_service import load_plans, seed_default_plans

    seed = factory()
    seed_default_plans(seed)
    load_plans(seed)
    seed.close()
    yield factory
    engine.dispose()


@pytest.fixture()
def db(SessionLocal):
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(SessionLocal):
    from app.main import app

    # Neutralize the MySQL-touching lifespan for tests.
    @asynccontextmanager
    async def _noop_lifespan(_app):
        yield

    app.router.lifespan_context = _noop_lifespan

    def override_get_db():
        session = SessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db

    from fastapi.testclient import TestClient

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()
