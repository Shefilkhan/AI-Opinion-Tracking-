# OpinionPulse — Full A–Z Audit (`AUDIT.md`)

> Autonomous senior-engineer audit of the OpinionPulse monorepo. Read-only findings
> plus a map of the system. Fixes applied during this pass are tracked in
> [`FIXES_APPLIED.md`](./FIXES_APPLIED.md); the remediation plan is in
> [`FIX_PLAN.md`](./FIX_PLAN.md).
>
> Branch: `fix/full-audit-and-repair` · Generated: 2026-07-17

---

## 1. Repository layout

```
AI-Opinion-Tracking-/
├─ opinionpulse/                      ← CANONICAL application
│  ├─ opinionpulse-backend/           FastAPI + SQLAlchemy + MySQL
│  │  ├─ app/                         142 Python modules
│  │  │  ├─ api/routes/               route handlers (18 mounted + 9 legacy)
│  │  │  ├─ core/                     config, security, startup checks
│  │  │  ├─ db/                       models.py (15 tables), schema_sync.py
│  │  │  ├─ schemas/                  Pydantic request/response models
│  │  │  └─ services/                 platforms/, AI, search, dashboard, crisis…
│  │  ├─ scripts/test_apis.py         live-API smoke harness
│  │  ├─ requirements.txt
│  │  └─ .env.example / .env.local.example
│  └─ opinionpulse-frontend/          React 19 + Vite 8 + TS 6  (235 src files)
│     └─ src/  (api/, lib/api/, hooks/, contexts/, pages/, components/)
├─ opinionpulse-frontend/             ← STALE DUPLICATE at repo root (ignore)
├─ docs/                              demo-script, testing checklist, THIS audit
└─ README.md
```

**Two frontends exist.** The live app is `opinionpulse/opinionpulse-frontend/`. The
root-level `opinionpulse-frontend/` is a stale duplicate and should not be edited
or built. All work in this audit targets the canonical `opinionpulse/` tree.

## 2. Tech stack & tooling

| Layer | Stack (verified from manifests) |
|---|---|
| Backend | Python 3.14, FastAPI ≥0.115, uvicorn, SQLAlchemy 2, PyMySQL, Pydantic 2 / pydantic-settings, APScheduler, Stripe ≥11, `groq`, `anthropic`, vaderSentiment, python-jose, bcrypt, **python-dateutil** (was missing — see FIX_PLAN) |
| Frontend | React 19.2, TypeScript ~6.0, Vite 8 (rolldown), React Router 7, TanStack Query 5, Tailwind 4, Recharts 3.8, Stripe.js 9, react-hook-form + zod |
| Database | MySQL/MariaDB `opinionpulse_db`; schema via `create_all` + `app/db/schema_sync.py` (no Alembic) |
| Dev ports | Backend `:8000`, Frontend `:5173` (Vite proxies `/api` + `/uploads` → `127.0.0.1:8000`) |
| Tests | `scripts/test_apis.py` only. No pytest, no `npm test`, no Docker, no local CI. |

Local toolchain used for this audit: Node v24.16, npm 11.13, Python 3.14.5, git 2.54.

## 3. Boot sequence

**Backend** — `app/main.py`:
1. `lifespan` → `reload_settings()` → `log_env_check()` → **`verify_production_secrets()`** (added this pass).
2. If `APP_ENV=development`: `ensure_database_exists()`, `Base.metadata.create_all()`, `ensure_users_schema()`.
3. Always: `ensure_plans_schema`, `ensure_mentions_schema`, `ensure_trending_snapshots_schema`, `ensure_chat_messages_schema`.
4. `seed_default_plans()` + `load_plans()`.
5. `start_pulse_scheduler()` — pulse scans + trending snapshots (APScheduler).
6. CORS for `localhost/127.0.0.1:5173/5174`, credentials allowed.
7. `/uploads` static mount; global exception handler (500 body = `str(exc)` in dev only).

**Frontend** — `src/main.tsx`: `bootstrapOAuthTokenFromUrl()` then providers
`ErrorBoundary > QueryClientProvider > BrowserRouter > ToastProvider > AuthProvider > UpgradeModalProvider > AppearanceProvider > App`.

## 4. Mounted routers & endpoints (18 routers, ~72 routes)

Auth legend: **Public** = no dependency · **User** = `Depends(get_current_user)` (401) · **Admin** = `get_current_admin_user` (403) · **+402** = a plan-limit check may raise HTTP 402.

| Prefix | Key endpoints | Auth |
|---|---|---|
| `/api` (health) | `GET /health`, `GET /health/db` | Public |
| `/api/newsletter` | `POST /join` | Public (rate-limited) |
| `/api/auth` | register/signup, login/signin, verify/resend OTP (register/login/reset), forgot/reset password, `GET /me`, `GET /providers`, Google `/google` + `/google/callback`, `POST /logout` | mostly Public; `/me` User |
| `/api/account` | `GET/PUT /profile`, `PUT /password`, `GET /stats`, `GET /usage` | User |
| `/api/users` | `GET /stats`, `PATCH /profile`, `GET /username/check`, `POST /avatar` | User |
| `/api/billing` | `GET /config` (Public), `POST /checkout-session`, `GET /session/{id}`, `POST /portal-session`, `POST /webhook` (Stripe sig) | mixed |
| `/api/dashboard` | `GET /overview`, `/debates`, `/most-discussed`, `/topics-table` | User |
| `/api` (search) | `POST /search` **+402**, `GET /search/history` | User |
| `/api/search` (public_demo) | `GET /public-demo` | Public (IP rate-limit) |
| `/api/ai` | `GET /status`, `POST /summarize|/debate|/predict` **+402**, `GET /insight-of-the-day`, `POST /crisis-response|/risk-analysis|/person-risk` | User |
| `/api/risk` | `POST /compare` **+402** | User |
| `/api/chat` | `POST /message` **+402**, conversations list/get/delete, `GET /export/{id}` | User |
| `/api/settings` | `GET /status` | User |
| `/api/personal-alerts` | list, `POST` **+402**, `PATCH/{id}`, `DELETE/{id}` | User |
| `/api/notifications` | `GET`, `PATCH /{id}/read`, `POST /read-all` | User |
| `/api/crisis` | `GET /radar`, `GET /detail/{id}`, `POST /scan/{id}`, `GET /events` | User |
| `/api/market` | `GET /chart`, `GET /quiver` | User |
| `/api/admin` | `POST /set-plan` | Admin |

**Auth mechanics** (`app/api/deps.py`): Bearer token wins over the `opinionpulse_token` HttpOnly cookie (deliberate — prevents a stale cookie serving an old account after a switch). `get_current_user` validates: token present → `decode_access_token` (rejects `pre_auth` tokens) → `is_session_valid` (server-side revocation) → active user. Frontend attaches `Authorization: Bearer <localStorage opinionpulse_token>` only when `auth:true` and always sends `credentials:"include"`.

## 5. Data layer — 15 tables (`app/db/models.py`)

`users`, `plans`, `usage_tracking`, `email_otps`, `auth_sessions`, `search_history`,
`saved_searches`, `chat_messages` (class `PulseChatMessage`), `mentions`,
`trending_snapshots`, `person_risk_profiles`, `newsletter_subscribers`,
`pulse_buckets`, `crisis_events`, `user_notifications`.

- The current `mentions` table is **search-based** (`search_query`, `platform`, `content`…) — it has none of the legacy project columns (`project_id`, `source`, `text`).
- `schema_sync.ensure_mentions_schema` performs a **destructive** migration: if the old columns are detected it `DROP`s `sentiment_results` and `mentions` and recreates them. Back up before first run against an existing DB.
- `ensure_chat_messages_schema` likewise drops/recreates `chat_messages` if columns are missing.

## 6. Configuration & environment

`Settings` (`app/core/config.py`) loads `.env` then `.env.local`, `extra="ignore"` (unknown vars silently dropped). Env var = field name uppercased.

**Required (backend):** `APP_ENV`, `SECRET_KEY`, `OTP_SECRET`, `FRONTEND_URL`, `DB_*`, plus feature keys as needed: `NEWS_API_KEY`, `GUARDIAN_API_KEY`, `GNEWS_API_KEY`, `CURRENTS_API_KEY`, `MEDIASTACK_API_KEY`, `YOUTUBE_API_KEY`, social tokens, `GROQ_API_KEY` (chat), **`ANTHROPIC_API_KEY` (AI insights on Search/dashboard — separate from Groq)**, Stripe keys, Google OAuth, SMTP.

**Env mismatches found (fixed this pass — see FIX_PLAN):**
- `.env.example` shipped a dead `JWT_SECRET` — `Settings` only reads `SECRET_KEY`. Setting `JWT_SECRET` alone left the signing key at its placeholder.
- `.env.example` `DATABASE_URL=mysql+aiomysql://…` is dead (the DSN is computed from `DB_*` with **pymysql**) and named the wrong driver.
- Frontend `.env.example` declared `VITE_API_URL`, but all code reads **`VITE_API_BASE_URL`** (`api/client.ts`, `api/chat.ts`, `lib/formatUtils.ts`). `VITE_APP_NAME` is unused.
- 🔒 `secret_key`/`otp_secret` default to publicly-known placeholders with (previously) no production guard. Added `verify_production_secrets()` which refuses to boot in `APP_ENV=production` while defaults/insecure cookie remain.

## 7. External integrations

- **13 live opinion sources** in `app/services/platforms/`: reddit_public, youtube_platform, hackernews, devto, news_api, guardian, gnews, currents, mediastack, bluesky, mastodon, github, stackoverflow, wikipedia (+ `news_trending`, shared `platform_common`, `query_helpers`, `source_quality`, `url_validation`, `sentiment_analysis`).
- **Groq** (`llama-3.3-70b-versatile`) — Pulse chat primary; **Anthropic** (`claude-sonnet-4-20250514`) — chat fallback AND the sole provider for `/api/ai/*` insights + risk + crisis narratives.
- **Stripe** (checkout, portal, webhook), **Google OAuth** (login + callback), **SMTP/Gmail** (OTP + newsletter), **Quiver** (optional market intelligence), **CoinGecko/Yahoo** (market chart).

Model strings and response parsing were verified correct (Groq `choices[0].message.content`, Anthropic `content[0].text`). `calculate_sentiment_forecast` is timezone-safe. (Two hypotheses from the original brief were disproven.)

## 8. Plan limits (`plan_service.seed_default_plans` → 402 via `plan_limits`)

| Limit | Starter | Pro | Enterprise |
|---|---|---|---|
| searches/month | 100 | ∞ | ∞ |
| data sources | reddit, hackernews, devto, newsapi, guardian, bluesky, mastodon | all | all |
| history days | 7 | 30 | 365 |
| AI summary/debate/predict | ✗ | ✓ | ✓ |
| chat/day | 5 | 100 | ∞ |
| realtime alerts | 0 | 5 | ∞ |
| csv rows | 100 | ∞ | ∞ |

402 body shape: `{detail:{error:"limit_exceeded", message, upgrade_to, upgrade_url}}`; frontend `api/client.ts` intercepts 402 → global `UpgradeModal`. Note: `parse_data_sources` fails **open** to `"all"` on malformed plan JSON.

## 9. AI opinion & tracking pipeline (6 flows)

1. **Search + live opinion** — `SearchPage → POST /api/search → search_service.run_search` (25 steps: resolve sources → parallel fetch → normalize → relevance/time filter → dedup → merge history → sentiment/age/risk/forecast → archive). Reddit is always-on and feeds this + chat + risk + crisis.
2. **Pulse AI chat** — `POST /api/chat/message → chat_service` (Groq→Anthropic) with live search context.
3. **AI insights** (Search page) — `/api/ai/* → ai_service` (**Anthropic only**; deterministic `_fallback_*` on error).
4. **Per-result risk** — `/api/ai/risk-analysis → ai_service.analyze_risk_profile` + deterministic `risk_scoring`.
5. **Crisis radar / pulse** — `pulse_scheduler → pulse_monitor_service → pulse_metrics/crisis_narrative/timeline → crisis_events` + email/notifications.
6. **Dashboard trending** — `pulse_scheduler → trending_snapshot_service`; reads via `dashboard_live/debates/topics_table` services.

**Confirmed defects in this pipeline** (top items fixed this pass; see FIX_PLAN for the full list): Reddit JSON `NameError` (flagship source returned 0), `asyncio.run()` inside the event loop crashing `/insight-of-the-day`, first-scan false-crisis in `pulse_metrics`, unvalidated crisis `severity` able to 500 the detail/scan responses, empty results cached for the TTL, `most_active_platform` miscount, and AI `_fallback_*` responses reported as `ai_enabled=True`.

## 10. Frontend structure

- **Routes** (`src/App.tsx`): public (`/`, `/explore`, `/pricing`, `/pricing/:planId`, legal, `/auth/*`) and protected via `ProtectedRoute` → `/auth/signin?redirect=` (`/dashboard`, `/search`, `/compare`, `/chat`, `/reports`, `/alerts`, `/crisis`, `/settings`, `/account`, `/billing/*`). Legacy redirects for `/signup`, `/login`, `/verify-*`, `/my-account`, `/mentions`, `/projects/*`. **No `*` catch-all** (unknown paths render blank).
- **API clients** (`src/api/*.ts`, `src/lib/api/*.ts`): one module per backend area; shared `client.ts` attaches Bearer + `credentials:include`, and turns a 402 into the global upgrade modal.
- **Hooks (13)**: `useDashboard`, `useTopicsTable`, `useCrisisRadar`, `useMarketChart`, `useQuiverIntelligence`, `useUsage`, `useAiInsights`, `useRiskAnalysis`, plus UI-only helpers.
- **Contexts (3)**: `AuthContext` (`GET /api/auth/me`, OAuth-callback handoff), `UpgradeModalContext`, `AppearanceContext`.
- `src/lib/api/sentiment.ts`: client-side keyword sentiment used only when a search response is `demo_mode:true` — this can **mask a degraded backend** on the search path (no user-facing notice). Flagged in FIX_PLAN.

## 11. Build, lint & health-scan results

| Check | Before | After fixes |
|---|---|---|
| `pip install -r requirements.txt` | ok, but **`python-dateutil` missing** → `from app.main import app` failed | added dep; **import OK (24 routes)** |
| `npm install` | ok | ok |
| `npm run build` (`tsc -b && vite build`) | **FAIL** — 3 TS errors (MarketPriceChart, SentimentDonutChart, RiskProfileCard) | **PASS** |
| `npm run lint` | **FAIL** — 39 errors / 6 warnings (mostly React-Compiler rules) | **PASS** — 0 errors / 41 warnings |
| `python scripts/test_apis.py` | runs; results depend on keys/DB | same (needs keys + MySQL) |
| MySQL `:3306` | — | **not available in this environment** (runtime DB flows unverifiable here) |

## 12. Legacy / dead code

- **9 unmounted route files** (`projects, keywords, sources, mentions, sentiment, analytics, collection, alerts, reports`) import removed models (`Project/Keyword/Source/Alert/Report/SentimentResult`) — they ImportError even transitively via `app/api/project_deps.py`. Confirmed by attempted import. **Marked DEPRECATED** this pass (header banner; not mounted).
- **2 dead services** (`dashboard_service.py`, `project_chat_service.py`) reference the same removed models; not imported by the running app. Marked DEPRECATED.
- `dashboard_overview_service.py` (all-random `demo_mode`) and `search_mock_data.py` are unused stubs. Frontend `getClientMockSearch`/`buildMockSearchResponse` are exported but uncalled.

## 13. Notable risks (carried into FIX_PLAN)

1. 🔒 Placeholder signing secrets in prod (now guarded); `AUTH_COOKIE_SECURE=false` default.
2. AI `_fallback_*` responses look successful (`ai_enabled=True`) — a model outage is indistinguishable from analysis.
3. `demo_mode` client sentiment can present a degraded backend as working on the Search page.
4. Reddit `search.json` is rate-limited/blocked from datacenter IPs — RSS fallback (403/429) is the resilient path.
5. Several dashboard/crisis figures are heuristic/hardcoded (e.g., fabricated 65/35 splits) rather than measured.
6. No automated test suite; verification relies on the live smoke script + manual QA.
