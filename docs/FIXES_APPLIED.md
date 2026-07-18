# OpinionPulse — Fixes Applied (`FIXES_APPLIED.md`)

> Final report of the autonomous audit & repair pass on branch
> `fix/full-audit-and-repair` (uncommitted per instruction). Full issue table:
> [`FIX_PLAN.md`](./FIX_PLAN.md). System map: [`AUDIT.md`](./AUDIT.md).

## Executive summary

Reviewed the entire codebase (backend 142 modules, frontend 235 files) with four
parallel deep audits (AI pipeline, routes/DB/config, auth, billing) and four
targeted bug-hunts (auth, billing, search, frontend). **34 issues were fixed**
across build, security, and core-correctness; 9 more are documented for a live
environment or a product decision.

**Headline bugs that were silently breaking the product:**
- **Reddit search returned 0** on every successful response (`NameError` on undefined `children`). Reddit is the always-on flagship source feeding search, chat, risk, and crisis — so all of them were degraded. *Fixed & verified live (returned real posts).*
- **Sentiment was inverted after any word ending in "nt"** (government, president, current, investment, recent…) — corrupting every sentiment score, summary, trend, forecast, and risk figure across the product. *Fixed & verified.*
- **Logout / session revocation didn't work** — `is_session_valid` accepted tokens with no session row, so a logged-out (or stolen) token stayed valid for 7 days. *Fixed & verified.*
- **`/api/ai/insight-of-the-day` 500'd** (`asyncio.run` inside the event loop). *Fixed & verified.*
- **Frontend didn't build** (3 Recharts/TS errors) and **the backend didn't import** (missing `python-dateutil`). *Both fixed.*
- **A brand watch's first scan fired a false "crisis" email.** *Fixed & verified.*

## Verification results (this environment)

| Check | Result |
|---|---|
| `pip install -r requirements.txt` → `from app.main import app` | ✅ imports, 24 routes |
| `npm run build` (`tsc -b && vite build`) | ✅ pass (was 3 errors) |
| `npm run lint` | ✅ 0 errors (41 warnings, all pre-existing React-Compiler advisories) |
| `python scripts/test_apis.py` | ✅ runs; Guardian 20, GNews 10, NewsAPI valid, Reddit adapter working |
| Backend unit checks (sentiment, pulse metrics, severity, validators, session helpers) | ✅ all pass |
| MySQL-backed flows, live Stripe/OAuth/SMTP | ⚠️ not runnable here (no DB / those keys) — fixed by code-correctness |

## What was fixed, by area

**AI opinion & tracking** — Reddit JSON parsing (B1), loop-safe async runner (B2),
first-scan crisis baseline (B3), crisis severity enum normalization (B4),
no-cache-on-empty + logging instead of emoji `print` (B5), generic
`most_active_platform` counter (B6).

**Auth & security** — session revocation actually revokes (C1), no account
enumeration on resend-OTP (C2), sessions cleared on password reset/change (C3),
strong password policy on account change (C4), reserved-username + format check
centralized (C5), username races return 400 not 500 (C6), and a production
secret guard that refuses to boot with placeholder secrets (G3).

**Search correctness** — sentiment negation fix (D1), HackerNews link-stories
kept (D2), news sources no longer zero multi-word queries (D3), Mediastack date
range (D4).

**Billing / plans** — `plan_renews_at` read from subscription items so past-due
downgrade works (E1), alert-limit enforced on re-enable (E2), newsletter email
best-effort (E3), data-sources fail closed (E4), usage-row race handled (E5).

**Frontend runtime** — OTP verify no longer races itself into a logout (F1),
401s clear the session and redirect instead of silently breaking every call
(F2), logout is best-effort (F3), no false upgrade modal when usage is pending
(F4), CSV export escapes all fields (F5), password rule aligned to 8 (F6),
sentiment filter applies correctly (F7).

**Cleanup / config** — env templates corrected (`JWT_SECRET`/`DATABASE_URL`,
`VITE_API_BASE_URL`) (G1–G2), 9 legacy routes + 2 dead services marked
DEPRECATED (G4), smoke harness hardened with Anthropic + search checks (G5).

## ⚠️ Needs your attention (not code — config/keys/infra)

1. **Replace three invalid API keys** — the live smoke test rejected them:
   - `GROQ_API_KEY` → **401 Invalid** (Pulse chat is down until fixed — most likely mis-copied from the screenshot).
   - `YOUTUBE_API_KEY` → "API key not valid."
   - `CURRENTS_API_KEY` → 401 Invalid token.
   Guardian, GNews, NewsAPI, Mastodon are valid; Reddit works (was rate-limited under repeated testing).
2. **Add `ANTHROPIC_API_KEY`** for real AI insights on the Search page / dashboard (Groq alone powers chat, not `/api/ai/*`). Without it those endpoints return deterministic fallbacks.
3. **Start MySQL** (XAMPP) so auth, search history, dashboard snapshots, saved searches, and crisis events persist. The app auto-creates `opinionpulse_db` in development.
4. **Set strong `SECRET_KEY` / `OTP_SECRET`** in `.env.local` for any non-local use — the app now refuses to boot in `APP_ENV=production` with the placeholder defaults. (Dev secrets were generated into `.env.local`.)
5. **Deferred items** needing coordinated work / live testing: OAuth token-in-URL + CSRF nonce (C7), OTP-window DB timezone (C9), multi-worker rate limiting (C10), Stripe portal plan-switch sync (E6), CSV export cap enforcement (E7). Details in FIX_PLAN.md. *(Google unverified-email auto-link, C8, was fixed.)*

## Remaining risks
- Several dashboard/crisis figures remain heuristic/hardcoded (e.g. fabricated 65/35 sentiment splits) — display-only, not measured. Left as-is (product decision).
- AI `_fallback_*` responses still report `ai_enabled=true` on some paths (B7) — an outage can look like a real analysis. Recommend surfacing the flag.
- No automated test suite; verification relies on `scripts/test_apis.py` + manual QA.

## How to run the project now

```powershell
# 1. Backend  (from opinionpulse/opinionpulse-backend)
#    Ensure MySQL (XAMPP) is running first.
.\venv\Scripts\activate
pip install -r requirements.txt          # now includes python-dateutil
#    .env.local already written with your keys + generated secrets.
uvicorn app.main:app --reload            # http://127.0.0.1:8000  (/docs)

# 2. Frontend (from opinionpulse/opinionpulse-frontend)
npm install
npm run dev                              # http://localhost:5173 (proxies /api → :8000)

# 3. Smoke test external APIs (backend root)
python scripts/test_apis.py

# 4. Quality gates
npm run build      # tsc -b && vite build   → passes
npm run lint       # eslint .                → 0 errors
```

All changes are on branch `fix/full-audit-and-repair` and are **not committed**.
