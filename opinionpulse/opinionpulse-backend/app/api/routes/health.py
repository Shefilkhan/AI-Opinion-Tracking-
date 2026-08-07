from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.source_health_service import get_source_health, get_source_health_summary

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
def health_check():
    summary = get_source_health_summary()
    return {
        "status": "ok",
        "message": "OpinionPulse backend is running",
        "sources_live": summary.get("live", 0),
        "sources_configured": summary.get("total_configured", 0),
        "any_source_live": summary.get("any_live", False),
        "rate_limited_sources": summary.get("rate_limited") or [],
    }


@router.get("/health/sources")
def sources_health_check(refresh: bool = Query(False, description="Force a fresh probe")):
    """Live probe of configured upstream data sources (cached ~90s)."""
    return get_source_health(force_refresh=refresh)


@router.get("/health/db")
def database_health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "ok",
            "database": "connected",
        }
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "error",
                "database": "disconnected",
                "message": str(exc),
            },
        ) from exc
