# OpinionPulse — Master Fix Plan (`FIX_PLAN.md`)

> Every issue found during the audit, ranked, with root cause, fix, and status.
> Status: ✅ Fixed & verified · 🩹 Fixed (code-correct, needs live env to fully exercise) ·
> 📝 Documented (deferred — needs product/infra decision or untestable here).
> Companion: [`AUDIT.md`](./AUDIT.md), [`FEATURES.md`](./FEATURES.md), [`FIXES_APPLIED.md`](./FIXES_APPLIED.md).

## Priority order used
1. Build/boot blockers (frontend TS build, missing backend dependency).
2. Crash bugs (500s / dead sources) in the AI opinion & tracking pipeline.
3. Security correctness (auth/session/secrets).
4. Core data correctness (sentiment, search relevance).
5. Billing/plan correctness.
6. Frontend runtime robustness.
7. Cleanup (legacy, env alignment, smoke harness).

---

## A. Build / boot blockers

| # | Sev | File | Root cause | Fix | Status |
|---|-----|------|-----------|-----|--------|
| A1 | Blocker | `opinionpulse-frontend/src/components/crisis/MarketPriceChart.tsx:155` | Recharts 3 `Tooltip.formatter` param is `ValueType\|undefined`; code typed it `number` | Infer param, coerce `Number(value)` | ✅ |
| A2 | Blocker | `.../dashboard/SentimentDonutChart.tsx:85` | `activeIndex` removed from `<Pie>` in Recharts 3 | Drop `activeIndex`/`activeShape`; drive highlight via Cell opacity | ✅ |
| A3 | Blocker | `.../search/RiskProfileCard.tsx:13` | Unused `User` import → `noUnusedLocals` build error | Remove import | ✅ |
| A4 | Blocker | `opinionpulse-backend/requirements.txt` | `python-dateutil` used in 7 modules but not declared → `from app.main import app` fails | Add `python-dateutil>=2.9.0` | ✅ |

## B. AI opinion & tracking pipeline (crash / empty / wrong output)

| # | Sev | File | Root cause | Fix | Status |
|---|-----|------|-----------|-----|--------|
| B1 | Critical | `services/platforms/reddit_public.py:111` | `for child in children` — `children` never defined → `NameError` on every HTTP‑200 → Reddit (flagship, always‑on) returns 0 | Parse `resp.json()` → `data.children`; also fall back to RSS on 429 | ✅ live-verified |
| B2 | High | `services/ai_service.py:318` + `dashboard_debates_service.py:236` | `asyncio.run()` inside the running event loop → `/api/ai/insight-of-the-day` 500 on cold cache | Loop-safe `_run_coro` (offload to a thread when a loop is running) | ✅ verified |
| B3 | High | `services/pulse_metrics.py:116-117` | First scan uses `current*0.5` baseline → ratio ≈2 → false "crisis" email/notification | Use current window as its own baseline (ratio≈1 → quiet) | ✅ verified |
| B4 | Medium | `services/crisis_narrative_service.py:132` | LLM `severity` stored unvalidated; schema requires `low\|medium\|high\|critical` → 500 on detail/scan | `_normalize_severity()` maps synonyms, defaults `medium` | ✅ verified |
| B5 | Medium | `services/cache_utils.py` | Empty/failed fetch (`[]`) cached for the TTL → a transient failure blanks a source for minutes; `print()` emoji can raise on non‑UTF‑8 consoles | Don't cache falsy results; `print`→`logger.debug` | ✅ |
| B6 | Low | `services/search_service.py:405` | `most_active_platform` only counted a few platforms | Count by actual result `platform` generically | ✅ |
| B7 | Low-Med | `routes/ai.py`, `services/ai_service.py` | `ai_enabled` actually tracks `ai_available()` on most routes; summarize/debate/predict 503 without a key. Residual: an in-service fallback on a *configured* call (timeout/parse error) isn't logged/flagged | 📝 Documented — add warning logs on in-service fallback for observability | 📝 |

## C. Auth / account security

| # | Sev | File | Root cause | Fix | Status |
|---|-----|------|-----------|-----|--------|
| C1 | Critical | `services/session_service.py:75` | `is_session_valid` returned `True` when no session row → logout/revocation impossible (token valid 7 days) | Return `False` when no live session row | ✅ verified |
| C2 | High | `api/routes/auth.py:349` | `resend-otp` returned 404 for unknown emails → account enumeration | Generic success (mirror forgot-password) | ✅ |
| C3 | Medium | `api/routes/auth.py:reset_password`, `routes/account.py:update_password` | Password reset/change didn't revoke sessions | Reset → revoke all; change → revoke other sessions | ✅ verified |
| C4 | Medium | `schemas/account.py:30` | Account password change allowed weak 6-char passwords | Enforce shared `PASSWORD_PATTERN` (8+ complexity) | ✅ verified |
| C5 | Low-Med | `services/user_profile_service.py` | Reserved usernames only checked on availability, not on write | Centralize reserved+format check in `validate_username` | ✅ verified |
| C6 | Low-Med | `routes/account.py`, `routes/users.py` | Username uniqueness TOCTOU → raw 500 | Catch `IntegrityError` → 400 | ✅ |
| C7 | High | `api/routes/auth.py:527` (Google callback) | 7-day token placed in redirect **URL**; no CSRF state nonce | 📝 Documented — needs coordinated FE change + OAuth testing (no Google keys here) | 📝 |
| C8 | Medium | `services/google_auth_service.py:27` | Google auto-linked to an existing local account without a verified email (takeover vector) | Reject linking unless `profile.email_verified` is true | 🩹 |
| C9 | Medium | `db/models.py` (EmailOTP), `services/otp_service.py:44` | OTP resend window mixed Python‑UTC with MySQL `NOW()` (server tz) | Gave `EmailOTP.created_at` a Python‑UTC default so both sides are UTC | 🩹 |
| C10 | Low | `services/auth_rate_limit.py` | In-memory limiter ineffective across workers | 📝 Documented — back with Redis for multi-worker | 📝 |

## D. Search / sentiment correctness

| # | Sev | File | Root cause | Fix | Status |
|---|-----|------|-----------|-----|--------|
| D1 | Critical | `services/sentiment_analysis.py:69` | `prev.endswith("nt")` negated words after *government/president/current/investment…* → inverted sentiment product-wide | Remove the clause (contractions already normalized to "not") | ✅ verified |
| D2 | High | `services/url_validation.py:57` | HN branch required `ycombinator.com` in URL, but story submissions carry the external article URL → dropped | `return True` for hackernews (URL already validated) | ✅ verified |
| D3 | Medium | `platforms/{news_api,guardian,gnews,currents,mediastack}.py` | Title-only "all terms" filter with `fallback_to_all=False` zeroed multi-word queries (e.g. "Climate Change") | `fallback_to_all=True` | ✅ |
| D4 | Medium | `platforms/mediastack.py:42` | `date=` sent a single day, not a range → stale/empty | Send `from,to` range | ✅ |

## E. Billing / plan correctness

| # | Sev | File | Root cause | Fix | Status |
|---|-----|------|-----------|-----|--------|
| E1 | High | `services/stripe_service.py:201` | Stripe 15.x moved `current_period_end` to items → `plan_renews_at` always null → past-due users never downgraded | Read from `items.data[0].current_period_end` | 🩹 |
| E2 | Medium | `routes/personal_alerts.py:151` | Alert limit checked on create but not on PATCH re-enable → bypassable | Check limit on False→True transition | 🩹 |
| E3 | Medium | `services/newsletter_service.py:22` | SMTP failure after the row commit → 503 with wrong "verification email" message | Best-effort email; return `email_sent=false` | 🩹 |
| E4 | Low | `services/plan_service.py:191` | `parse_data_sources` failed **open** to `"all"` on corrupt config | Fail closed to the Starter source set | 🩹 |
| E5 | Low | `services/plan_service.py:257` | Concurrent first-request-of-period → `IntegrityError` | Catch, rollback, re-select | 🩹 |
| E6 | Medium | `services/stripe_service.py:223` | Portal plan switch kept stale `metadata.plan_id` | Resolve plan from the subscription's actual price id (reverse map), metadata fallback | 🩹 |
| E7 | Low-Med | `routes/reports.py` (deprecated), `SearchPage.tsx` | Backend CSV endpoints are dead legacy (unmounted); the live CSV export is client-side and **already** slices to the plan row cap | N/A — client-side cap verified; backend `check_csv_export_limit` is dead code | ✅ |

## F. Frontend runtime

| # | Sev | File | Root cause | Fix | Status |
|---|-----|------|-----------|-----|--------|
| F1 | High | `pages/auth/VerifyOtpPage.tsx:62` | Fire-and-forget `clearAuthSession()` late `removeToken()` deletes the token OTP verify just stored → logged out after success | Clear token synchronously (no async race) | ✅ build-verified |
| F2 | Medium | `api/client.ts` | No 401 handling → expired session leaves app broken until reload | On 401(auth): `removeToken()` + dispatch `session-expired`; AuthContext listener drops user → redirect | ✅ |
| F3 | Low-Med | `api/auth.ts:187` | `logoutUser` re-threw on failure → half-logged-out + unhandled rejection | Swallow request error (finally still clears token) | ✅ |
| F4 | Low | `hooks/useAiInsights.ts:44` | Null usage treated as "allowed" → gated AI calls → 402 → unprompted upgrade modal | Skip while `usage` is null (re-runs when it loads) | ✅ |
| F5 | Low | `pages/SearchPage.tsx:148` | CSV escaped only `content` → comma in author/URL corrupts rows | Escape every field | ✅ |
| F6 | Low | `components/settings/ChangePasswordSection.tsx` | Client allowed 6 chars vs backend 8 | Align to 8 | ✅ |
| F7 | Low | `lib/api/searchFilters.ts:53` | Sentiment filter no-ops when nothing matches (keeps full list) | Filter unconditionally; show empty-state | ✅ |
| F8 | Low | `lib/api/search.ts` (demo_mode) | Dead client re-scoring path that could mask a degraded backend | Removed the dead `demo_mode` branch | ✅ |

## G. Config / env / cleanup

| # | File | Fix | Status |
|---|------|-----|--------|
| G1 | backend `.env.example` | Remove dead `JWT_SECRET`; document `DATABASE_URL` is derived from `DB_*` (pymysql); clarify `ANTHROPIC_API_KEY` is required for AI insights | ✅ |
| G2 | frontend `.env.example` | `VITE_API_URL` → `VITE_API_BASE_URL` (the var the code actually reads) | ✅ |
| G3 | `core/startup_checks.py` + `main.py` | `verify_production_secrets()` — refuse to boot in production with placeholder `SECRET_KEY`/`OTP_SECRET` or insecure cookie | ✅ |
| G4 | 9 legacy routes + 2 dead services | Prepend DEPRECATED banner (not mounted; ImportError against current model) | ✅ syntax-verified |
| G5 | `scripts/test_apis.py` | Add Anthropic + Reddit-adapter checks; fix stdout rewrap that broke captured runs | ✅ ran clean |
| G6 | `app/__init__.py` | Reassigned `sys.stdout` at import → broke pytest capture & captured pipes | Use `reconfigure()` instead of replacing the stream objects | ✅ |
| G7 | `tests/` (new) + `requirements-dev.txt`, `pytest.ini` | Project had **zero** automated tests | Added 45-test pytest suite (SQLite + TestClient) covering logic, DB services, auth flow, plan gating, billing, and endpoint smokes — all green | ✅ |

## Needs your input / environment (not code bugs)
- **Invalid API keys** (smoke test): `GROQ_API_KEY` (401), `YOUTUBE_API_KEY` (invalid), `CURRENTS_API_KEY` (401). Replace these — likely mis-copied. Guardian/GNews/NewsAPI valid; Reddit works (rate-limited under heavy testing).
- **No `ANTHROPIC_API_KEY`** → `/api/ai/*` insights run deterministic fallbacks. Add a key for real insights.
- **No MySQL** in this environment → auth, history, dashboard persistence, saved searches, crisis events can't run here. Start XAMPP/MySQL (`opinionpulse_db`, root/no-password by default).
- **No Stripe / Google OAuth / SMTP** keys → those flows fixed by code-correctness only; verify once configured.
