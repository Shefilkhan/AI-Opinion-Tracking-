# OpinionPulse — Feature Inventory (`FEATURES.md`)

> Status of every implemented feature after the audit-and-repair pass.
> Legend: ✅ working · 🔧 fixed this pass (was broken) · ⚠️ works but needs config (API key / DB) ·
> ❌ broken/deprecated · 🧪 stub/mock. "Verified" = exercised in this environment; many flows
> require MySQL + API keys that are absent here and are marked *needs runtime env*.

---

## Authentication & accounts

| Feature | Status | Primary files / endpoints | Notes |
|---|---|---|---|
| Email + password signup with OTP | ⚠️ | `routes/auth.py`, `services/*otp*`, `email_otps` table | Needs SMTP creds; dev exposes OTP in API when email unconfigured. |
| Sign-in with OTP / lockout | ⚠️ | `routes/auth.py`, `auth_rate_limit.py` | Rate-limit + lockout logic present. Needs DB. |
| Forgot / reset password | ⚠️ | `routes/auth.py` | OTP-gated reset. Needs SMTP + DB. |
| Google OAuth (login + callback) | ⚠️ | `routes/auth.py`, `google_oauth_service.py`, FE `GoogleCallbackPage`, `bootstrapOAuthToken.ts` | Needs Google client id/secret + redirect `http://127.0.0.1:8000/api/auth/google/callback`. |
| Session validation & revocation | ✅ | `deps.py`, `session_service.py`, `auth_sessions` | Bearer-over-cookie; server-side revocable sessions. |
| Profile / avatar / username | ⚠️ | `routes/account.py`, `routes/users.py` | Avatar upload writes to `/uploads`. Needs DB. |

## Search & live opinion (core)

| Feature | Status | Primary files / endpoints | Notes |
|---|---|---|---|
| Multi-source search | 🔧⚠️ | `POST /api/search`, `search_service.run_search`, `platforms/*` | **Reddit was dead (NameError) — fixed & live-verified (4 results).** News/social sources need their API keys. |
| 13 platform adapters | ⚠️ | `services/platforms/*.py` | Keyless: reddit, hackernews, devto, wikipedia, stackoverflow. Others need keys. |
| Relevance / quality filtering | ⚠️ | `source_quality.py` | Threshold=2 can drop thin matches; tune for broad queries (see FIX_PLAN). |
| Sentiment analysis | ✅ | `sentiment_analysis.py` (vader + keywords) | Summary/intensity/forecast; forecast is timezone-safe. |
| Search history | ⚠️ | `GET /api/search/history`, `search_history` | Needs DB. |
| Public demo search | ⚠️ | `GET /api/search/public-demo` | IP rate-limited, no auth. |

## AI features

| Feature | Status | Primary files / endpoints | Notes |
|---|---|---|---|
| Pulse AI chat | ⚠️ | `POST /api/chat/message`, `chat_service.py` | Groq→Anthropic. Needs `GROQ_API_KEY`. Returns friendly error if no provider. |
| AI insights (summary/debate/predict) | ⚠️ | `/api/ai/*`, `ai_service.py` | **Anthropic-only** — needs `ANTHROPIC_API_KEY`. Without it, deterministic fallbacks (now clearly gated). |
| Insight of the day | 🔧⚠️ | `GET /api/ai/insight-of-the-day` | **Was 500 (asyncio.run in event loop) — fixed.** Needs Anthropic for full output. |
| Per-result risk analysis | ⚠️ | `/api/ai/risk-analysis`, `risk_scoring.py` | Anthropic classification + deterministic scoring. |
| Topic risk compare | ⚠️ | `POST /api/risk/compare` | Deterministic; frontend `compareTopicRisks()` is exported but unused. |

## Crisis radar & alerts

| Feature | Status | Primary files / endpoints | Notes |
|---|---|---|---|
| Brand-watch pulse scan | 🔧⚠️ | `pulse_scheduler.py`, `pulse_monitor_service.py`, `pulse_metrics.py` | **First-scan false-crisis fixed.** Runs on `saved_searches` with `alert_enabled`+threshold. |
| Crisis radar / detail / scan | 🔧⚠️ | `/api/crisis/*`, `crisis_narrative_service.py` | **Unvalidated `severity` could 500 detail/scan — fixed (enum-normalized).** |
| Crisis events + email/notify | ⚠️ | `crisis_events`, `notification_service`, `email_service` | Needs SMTP for email. |
| Personal alerts (CRUD) | ⚠️ | `/api/personal-alerts`, `saved_searches` | Plan-gated (Starter=0). |
| Notifications | ⚠️ | `/api/notifications`, `user_notifications` | list / mark-read / read-all. |

## Dashboard & trending

| Feature | Status | Primary files / endpoints | Notes |
|---|---|---|---|
| Dashboard overview | ⚠️ | `/api/dashboard/overview`, `dashboard_live_service.py` | Live path used (not the dead `dashboard_overview_service`). Some pulse %s are heuristic/hardcoded. |
| Trending snapshots | 🔧⚠️ | `trending_snapshot_service.py`, `trending_snapshots` | **`most_active_platform` miscount fixed;** empty-cache suppression fixed. Reddit trending uses RSS. |
| Debates / most-discussed / topics table | ⚠️ | `/api/dashboard/*`, `dashboard_debates_service.py` | Needs ≥5 results/≥2 platforms per topic → needs keys for density. |
| Market chart / Quiver | ⚠️ | `/api/market/*`, `market_service` | CoinGecko/Yahoo; Quiver optional (`QUIVER_API_KEY`). MarketPriceChart TS error fixed. |

## Billing (Stripe)

| Feature | Status | Primary files / endpoints | Notes |
|---|---|---|---|
| Plans & limits (402 gating) | ✅ | `plan_service.py`, `plan_limits.py` | Seeded on startup; frontend UpgradeModal on 402. |
| Checkout (hosted/embedded) | ⚠️ | `/api/billing/checkout-session`, `stripe_service.py` | Needs Stripe keys + price ids. |
| Portal / session status | ⚠️ | `/api/billing/portal-session`, `/session/{id}` | Needs Stripe. |
| Webhook → plan sync | ⚠️ | `POST /api/billing/webhook` | Needs `stripe listen` locally or a deployed endpoint + `STRIPE_WEBHOOK_SECRET`. |

## Other

| Feature | Status | Primary files / endpoints | Notes |
|---|---|---|---|
| Compare topics | ⚠️ | FE `ComparePage`, `/api/risk/compare` | |
| Reports / CSV export | ✅ | FE `ReportsPage` (+ purity fix), `/api/search/history` | Client-side CSV export; recency filter now render-pure. |
| Explore demo | ⚠️ | FE `ExplorePage`, `/api/search/public-demo` | |
| Newsletter join | ⚠️ | `/api/newsletter/join` | Emails admin; needs SMTP. |
| Settings / appearance | ✅ | FE `SettingsPage`, `AppearanceContext` | Theme persists locally. |
| Admin set-plan | ⚠️ | `POST /api/admin/set-plan` | Admin-only. |

## Legacy / removed (❌)

Project-based system — **9 route files + 2 services** (`projects, keywords, sources,
mentions, sentiment, analytics, collection, alerts, reports`, `dashboard_service`,
`project_chat_service`) reference deleted models and are unmounted/broken. Marked
DEPRECATED this pass; do not re-enable without rebuilding against the 15-table model.
