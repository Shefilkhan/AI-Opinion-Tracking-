"""Capture OpinionPulse UI screenshots for the SSRIP presentation."""

from __future__ import annotations

import sys
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent / "screenshots"
BASE_URL = "http://localhost:5173"


def capture() -> list[Path]:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as exc:
        raise SystemExit(
            "Playwright is required. Install with:\n"
            "  pip install playwright && playwright install chromium"
        ) from exc

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    saved: list[Path] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.set_default_timeout(30_000)

        def shot(name: str) -> Path:
            path = OUT_DIR / f"{name}.png"
            page.screenshot(path=str(path), full_page=False)
            saved.append(path)
            print(f"  saved {path.name}")
            return path

        # Landing hero
        page.goto(f"{BASE_URL}/", wait_until="networkidle")
        page.wait_for_timeout(1200)
        shot("01_landing_hero")

        page.evaluate("window.scrollTo(0, 900)")
        page.wait_for_timeout(800)
        shot("02_landing_features")

        # Explore sandbox — search results
        page.goto(f"{BASE_URL}/explore", wait_until="networkidle")
        page.wait_for_timeout(1000)
        page.get_by_role("button", name="Bitcoin").click()
        page.wait_for_timeout(1500)
        shot("03_explore_search_results")

        # Explore — dashboard preview
        page.get_by_role("button", name="Dashboard view").click()
        page.wait_for_timeout(1500)
        shot("04_explore_dashboard")

        # Explore — AI topic (topic pill, not benefit buttons)
        page.locator("button.explore-topic-pill", has_text="AI").click()
        page.wait_for_timeout(1200)
        shot("05_explore_ai_topic")

        # Pricing
        page.goto(f"{BASE_URL}/pricing", wait_until="networkidle")
        page.wait_for_timeout(1000)
        shot("06_pricing_plans")

        browser.close()

    return saved


if __name__ == "__main__":
    print(f"Capturing screenshots from {BASE_URL} ...")
    try:
        paths = capture()
    except Exception as exc:
        print(f"Screenshot capture failed: {exc}", file=sys.stderr)
        print("Ensure the frontend dev server is running on port 5173.", file=sys.stderr)
        sys.exit(1)
    print(f"Done — {len(paths)} images in {OUT_DIR}")
