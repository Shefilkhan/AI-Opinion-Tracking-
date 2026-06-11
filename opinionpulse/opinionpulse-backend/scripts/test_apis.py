"""Smoke-test all configured external APIs. Run from backend root:
    python scripts/test_apis.py
"""

from __future__ import annotations

import io
import sys
import time
from dataclasses import dataclass

# Windows console: avoid emoji logging crashes from platform helpers
if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "buffer"):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

# Allow imports from app package
sys.path.insert(0, ".")

QUERY = "technology"


def _test_currents(s) -> str:
    import requests

    key = s.currents_api_key.strip()
    if not key:
        raise ValueError("CURRENTS_API_KEY not configured")
    resp = requests.get(
        "https://api.currentsapi.services/v1/search",
        params={"keywords": QUERY, "language": "en", "apiKey": key},
        timeout=30,
    )
    data = resp.json()
    if resp.status_code != 200:
        raise RuntimeError(f"HTTP {resp.status_code}: {data.get('msg', resp.text[:120])}")
    count = len(data.get("news") or [])
    return f"{count} articles"


def _test_reddit() -> str:
    import requests
    from app.core.config import get_settings

    ua = get_settings().reddit_user_agent.strip() or "Mozilla/5.0 OpinionPulse/1.0"
    resp = requests.get(
        "https://www.reddit.com/search.json",
        params={"q": QUERY, "sort": "new", "limit": 5, "t": "day"},
        headers={"User-Agent": ua, "Accept": "application/json"},
        timeout=15,
    )
    if resp.status_code == 403:
        raise RuntimeError(
            "HTTP 403 — Reddit blocked the request. Set REDDIT_CLIENT_ID/SECRET or use a browser-like User-Agent."
        )
    resp.raise_for_status()
    posts = resp.json().get("data", {}).get("children", [])
    return f"{len(posts)} posts"


@dataclass
class Result:
    name: str
    ok: bool
    detail: str
    ms: int


def run(name: str, fn) -> Result:
    start = time.perf_counter()
    try:
        detail = fn()
        ms = int((time.perf_counter() - start) * 1000)
        return Result(name, True, detail, ms)
    except Exception as exc:
        ms = int((time.perf_counter() - start) * 1000)
        return Result(name, False, str(exc), ms)


def main() -> int:
    from app.core.config import get_settings

    s = get_settings()
    results: list[Result] = []

    print("OpinionPulse API smoke tests")
    print("=" * 60)
    print(f"Query: {QUERY!r}\n")

    # Config presence
    config_checks = [
        ("NEWS_API_KEY", bool(s.news_api_key.strip())),
        ("GUARDIAN_API_KEY", bool(s.guardian_api_key.strip())),
        ("GNEWS_API_KEY", bool(s.gnews_api_key.strip())),
        ("CURRENTS_API_KEY", bool(s.currents_api_key.strip())),
        ("YOUTUBE_API_KEY", bool(s.youtube_api_key.strip())),
        ("GROQ_API_KEY", bool(s.groq_api_key.strip())),
        ("AI_PROVIDER", s.ai_provider),
        ("GOOGLE_OAUTH", bool(s.google_client_id.strip() and s.google_client_secret.strip())),
        ("EMAIL", s.email_configured),
    ]
    for label, value in config_checks:
        print(f"  [config] {label}: {value}")

    print()

    from app.services.platforms.news_api import search_news
    from app.services.platforms.guardian import search_guardian
    from app.services.platforms.gnews import search_gnews
    from app.services.youtube_service import search_youtube_videos

    results.append(
        run("NewsAPI", lambda: f"{len(search_news(QUERY, page_size=5))} articles")
    )
    results.append(
        run("Guardian", lambda: f"{len(search_guardian(QUERY))} articles")
    )
    results.append(
        run("GNews", lambda: f"{len(search_gnews(QUERY))} articles")
    )
    results.append(run("Currents", lambda: _test_currents(s)))
    results.append(
        run(
            "YouTube",
            lambda: (
                f"{len(search_youtube_videos(QUERY, max_results=2))} videos"
                if s.youtube_api_key.strip()
                else "skipped (no key)"
            ),
        )
    )
    results.append(run("Reddit (public)", _test_reddit))

    def test_groq() -> str:
        from groq import Groq

        if not s.groq_api_key.strip():
            return "skipped (no key)"
        client = Groq(api_key=s.groq_api_key.strip())
        resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": "Reply with exactly: OK"}],
            max_tokens=10,
            temperature=0,
        )
        text = (resp.choices[0].message.content or "").strip()
        return f"response={text!r}"

    results.append(run("Groq AI", test_groq))

    def test_db() -> str:
        from sqlalchemy import text
        from app.db.database import SessionLocal

        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
            return "connected"
        finally:
            db.close()

    results.append(run("MySQL database", test_db))

    def test_smtp() -> str:
        if not s.email_configured:
            return "skipped (not configured)"
        import smtplib

        with smtplib.SMTP(s.smtp_host, s.smtp_port, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(s.email_user or s.smtp_user, s.email_app_password or s.smtp_password)
        return "SMTP login OK"

    results.append(run("Gmail SMTP", test_smtp))

    print()
    passed = 0
    failed = 0
    for r in results:
        status = "PASS" if r.ok else "FAIL"
        symbol = "+" if r.ok else "x"
        print(f"  [{symbol}] {status:4}  {r.name:<18} ({r.ms}ms)  {r.detail}")
        if r.ok:
            passed += 1
        else:
            failed += 1

    print()
    print(f"Summary: {passed} passed, {failed} failed, {len(results)} total")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
