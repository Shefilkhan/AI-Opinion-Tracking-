"""Background scheduler for brand-watch pulse scans."""

from __future__ import annotations

import asyncio
import logging
import os

from apscheduler.schedulers.background import BackgroundScheduler

from app.core.config import get_settings
from app.db.database import SessionLocal
from app.services.pulse_monitor_service import scan_all_enabled_watches

logger = logging.getLogger(__name__)

_scheduler: BackgroundScheduler | None = None


def _run_pulse_scan_job() -> None:
    """Sync wrapper for APScheduler."""
    try:
        asyncio.run(_async_scan())
    except Exception as exc:
        logger.error("Pulse scan job failed: %s", exc)


async def _async_scan() -> None:
    with SessionLocal() as db:
        count = await scan_all_enabled_watches(db)
        if count:
            logger.info("Early-Warning Pulse: scanned %s brand watch(es)", count)


def start_pulse_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        return

    interval = int(os.getenv("PULSE_SCAN_INTERVAL_MINUTES", "10"))
    _scheduler = BackgroundScheduler(daemon=True)
    _scheduler.add_job(
        _run_pulse_scan_job,
        trigger="interval",
        minutes=max(interval, 5),
        id="pulse_brand_watch_scan",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info(
        "Early-Warning Pulse scheduler started (every %s min, env=%s)",
        interval,
        get_settings().app_env,
    )


def stop_pulse_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
