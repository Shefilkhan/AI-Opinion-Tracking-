"""Smoke-test all configured external APIs. Run from backend root:
    python scripts/test_apis.py
"""

from __future__ import annotations

import sys
import time
from dataclasses import dataclass

# Windows console: force UTF-8 so emoji in logs don't crash, without replacing
# the stream objects (replacing them breaks flushing under a captured pipe).
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

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
    import xml.etree.ElementTree as ET
    from app.core.config import get_settings

    ua = get_settings().reddit_user_agent.strip() or "Mozilla/5.0 OpinionPulse/1.0"
    resp = requests.get(
        "https://www.reddit.com/search.rss",
        params={"q": QUERY, "sort": "new", "limit": 5, "t": "day"},
        headers={"User-Agent": ua},
        timeout=15,
    )
    resp.raise_for_status()
    root = ET.fromstring(resp.content)
    namespaces = {'atom': 'http://www.w3.org/2005/Atom'}
    entries = root.findall('.//atom:entry', namespaces)
    posts = [
        e for e in entries 
        if "/comments/" in (e.find('atom:link', namespaces).attrib.get('href') if e.find('atom:link', namespaces) is not None else "")
    ]
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
    from app.services.google_oauth_service import is_google_oauth_configured

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
        ("MEDIASTACK_API_KEY", bool(s.mediastack_api_key.strip())),
        ("YOUTUBE_API_KEY", bool(s.youtube_api_key.strip())),
        ("GROQ_API_KEY", bool(s.groq_api_key.strip())),
        ("ANTHROPIC_API_KEY", bool(s.anthropic_api_key.strip())),
        ("MASTODON_ACCESS_TOKEN", bool(s.mastodon_access_token.strip())),
        ("AI_PROVIDER", s.ai_provider),
        ("GOOGLE_OAUTH", is_google_oauth_configured()),
        ("EMAIL", s.email_configured),
    ]
    for label, value in config_checks:
        print(f"  [config] {label}: {value}")

    print()

    from app.services.platforms.news_api import search_news
    from app.services.platforms.guardian import search_guardian
    from app.services.platforms.gnews import search_gnews
    from app.services.platforms.mediastack import search_mediastack
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
    if s.mediastack_api_key.strip():
        results.append(
            run("Mediastack", lambda: f"{len(search_mediastack(QUERY))} articles")
        )
    else:
        results.append(Result("Mediastack", True, "skipped (no key)", 0))
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

    def test_anthropic() -> str:
        if not s.anthropic_api_key.strip():
            return "skipped (no key)"
        from anthropic import Anthropic

        client = Anthropic(api_key=s.anthropic_api_key.strip())
        msg = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=10,
            messages=[{"role": "user", "content": "Reply with exactly: OK"}],
        )
        text = (msg.content[0].text if msg.content else "").strip()
        return f"response={text!r}"

    results.append(run("Anthropic AI", test_anthropic))

    def test_search_reddit() -> str:
        # Exercises the real search_reddit() path (JSON with RSS fallback),
        # verifying the fixed Reddit adapter end-to-end.
        from app.services.platforms.reddit_public import search_reddit

        rows = search_reddit(QUERY, "24h", 5)
        return f"{len(rows)} results"

    results.append(run("Search: Reddit adapter", test_search_reddit))

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
