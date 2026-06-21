import logging
import time

from fastapi import APIRouter, HTTPException, Query, Request

from app.services import search_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/search", tags=["public-demo"])

_demo_rate_limit: dict[str, list[float]] = {}
DEMO_RATE_LIMIT = 5
DEMO_WINDOW = 3600
DEMO_SOURCES = ["reddit", "hackernews", "devto", "newsapi"]


@router.get("/public-demo")
async def public_demo_search(
    request: Request,
    q: str = Query(..., min_length=2, max_length=100),
):
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()

    history = _demo_rate_limit.get(client_ip, [])
    history = [t for t in history if now - t < DEMO_WINDOW]

    if len(history) >= DEMO_RATE_LIMIT:
        raise HTTPException(
            status_code=429,
            detail="Demo search limit reached. Sign up free for unlimited searches.",
        )

    history.append(now)
    _demo_rate_limit[client_ip] = history

    query = q.strip()
    logger.info('Public demo search: "%s" from %s', query, client_ip)

    data = await search_service.run_search(
        query=query,
        platform="all",
        time_range="24h",
        sentiment="all",
        sort_by="recent",
        source_allowlist=DEMO_SOURCES,
    )

    results = data.get("results", [])[:4]

    return {
        "results": results,
        "is_demo": True,
        "sources_searched": DEMO_SOURCES,
        "query": query,
        "total_results": len(results),
        "sentiment_summary": data.get("sentiment_summary"),
    }
