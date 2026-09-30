"""Optional xAI integration — web search and X search via Responses API."""

from __future__ import annotations

import logging
import os
from typing import Any

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

XAI_API_BASE = "https://api.x.ai/v1"


def _xai_key() -> str:
    settings = get_settings()
    return os.getenv("XAI_API_KEY", getattr(settings, "xai_api_key", "") or "").strip()


def xai_configured() -> bool:
    return bool(_xai_key())


async def search_web(query: str, *, max_results: int = 5) -> dict[str, Any]:
    """Search the web via xAI when configured."""
    key = _xai_key()
    if not key:
        return {
            "results": [],
            "error": "Web search unavailable — XAI_API_KEY not configured",
        }

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(
                f"{XAI_API_BASE}/responses",
                headers={
                    "Authorization": f"Bearer {key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "grok-3-fast",
                    "input": [
                        {
                            "role": "user",
                            "content": f"Search the web for current factual information about: {query}. Return concise bullet facts with source titles and URLs.",
                        }
                    ],
                    "tools": [{"type": "web_search"}],
                },
            )
            response.raise_for_status()
            data = response.json()
            return _parse_xai_search_output(data, source_type="web")
    except Exception as exc:
        logger.warning("xAI web search failed: %s", exc)
        return {"results": [], "error": str(exc)}


async def search_x(query: str, *, max_results: int = 8) -> dict[str, Any]:
    """Search X via xAI when configured."""
    key = _xai_key()
    if not key:
        return {
            "results": [],
            "error": "X search unavailable — XAI_API_KEY not configured",
        }

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(
                f"{XAI_API_BASE}/responses",
                headers={
                    "Authorization": f"Bearer {key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "grok-3-fast",
                    "input": [
                        {
                            "role": "user",
                            "content": f"Search X for recent posts about: {query}. Summarize key posts with author and URL when available.",
                        }
                    ],
                    "tools": [{"type": "x_search"}],
                },
            )
            response.raise_for_status()
            data = response.json()
            return _parse_xai_search_output(data, source_type="x")
    except Exception as exc:
        logger.warning("xAI X search failed: %s", exc)
        return {"results": [], "error": str(exc)}


def _parse_xai_search_output(data: dict[str, Any], *, source_type: str) -> dict[str, Any]:
    """Best-effort parse of xAI Responses API output into factual source items."""
    results: list[dict[str, Any]] = []
    text_chunks: list[str] = []

    for item in data.get("output") or data.get("choices") or []:
        if isinstance(item, dict):
            content = item.get("content") or item.get("text") or ""
            if isinstance(content, list):
                for block in content:
                    if isinstance(block, dict):
                        if block.get("type") == "output_text":
                            text_chunks.append(str(block.get("text", "")))
                        elif block.get("type") == "text":
                            text_chunks.append(str(block.get("text", "")))
            elif content:
                text_chunks.append(str(content))

            for citation in item.get("citations") or []:
                if isinstance(citation, dict):
                    results.append(
                        {
                            "title": citation.get("title") or citation.get("url", "")[:80],
                            "url": citation.get("url"),
                            "snippet": citation.get("snippet") or citation.get("text", ""),
                            "source_type": source_type,
                        }
                    )

    summary = "\n".join(t for t in text_chunks if t.strip()).strip()
    if summary and not results:
        results.append(
            {
                "title": f"{source_type} search summary",
                "url": None,
                "snippet": summary[:1200],
                "source_type": source_type,
            }
        )

    return {"results": results[:10], "raw_text": summary}
