# OpinionPulse — Project Overview & Technology Stack

This document describes what OpinionPulse is, who it is for, how it works, and the full technology stack with reasons for each choice.

---

## Table of contents

1. [What is OpinionPulse?](#what-is-opinionpulse)
2. [How it works](#how-it-works)
3. [Main features](#main-features)
4. [Benefits](#benefits)
5. [Use cases](#use-cases)
6. [Data sources](#data-sources)
7. [Technology stack](#technology-stack)
8. [Monorepo layout](#monorepo-layout)
9. [How to run locally](#how-to-run-locally)
10. [One-line pitch](#one-line-pitch)

---

## What is OpinionPulse?

**OpinionPulse** is a full-stack web application that tracks **public opinion** about any topic, brand, product, or person. It pulls live data from social media, news sites, and tech platforms, then turns that data into sentiment scores, summaries, charts, and actionable insights.

Instead of manually scrolling Reddit, Twitter/X, YouTube, or news sites, users can:

- Search any topic and see **real mentions** from many sources
- Measure **positive / neutral / negative** sentiment
- Compare two topics side by side (e.g. React vs Angular)
- Monitor **crises** and negative spikes
- Ask **Pulse AI** questions about what people are saying
- Export data for reports and stakeholders

**In one sentence:** OpinionPulse answers *“What does the world think about X — right now?”*

---

## How it works

```
You search a topic
       ↓
Backend fetches live data (Reddit, YouTube, News, GitHub, etc.)
       ↓
Sentiment + relevance analysis (VADER, filters, ranking)
       ↓
Dashboard shows summary, charts, and result feed
       ↓
Compare / Crisis Radar / AI Chat / Export
```

### Step-by-step flow

1. **Sign in** — Email + OTP or Google OAuth; JWT token stored for API calls.
2. **Search** — Enter a keyword (e.g. `Climate Change`, `odyssey`, `React`).
3. **Backend** — FastAPI runs parallel fetches from 13+ sources.
4. **Processing** — Spam filtering, relevance scoring, sentiment analysis, deduplication.
5. **Frontend** — React displays topic summary, charts, word cloud, platform breakdown, and raw posts.
6. **Optional AI** — With API keys, Pulse AI adds deeper analysis and chat with cited sources.

---

## Main features

| Feature | Route | What it does |
|---------|-------|--------------|
| **Dashboard** | `/dashboard` | Trending topics, debates, platform pulse, recent activity |
| **Search** | `/search?q=topic` | Core search with filters, topic summary, charts, results feed, CSV export |
| **Compare** | `/compare` | Side-by-side analysis of two topics with comparison conclusion |
| **Crisis Radar** | `/crisis-radar` | Detects spikes in negative sentiment and volume |
| **Ask Pulse AI** | `/chat` | Chat over search results with cited sources |
| **Reports** | `/reports` | Search history and export |
| **Brand Monitor** | `/alerts` | Keyword alerts and watches |

### Search page highlights

- **Topic Summary** — Wikipedia context + live mention stats + discussion highlights
- **Sentiment charts** — 24h trend, platform share, forecast, word cloud
- **Filters** — Platform, time range, sentiment, sort, language
- **Source status** — Which APIs returned data vs failed

### Compare page highlights

- **Topic Summary** per column with Wikipedia link
- **Comparison Conclusion** — Rule-based volume, sentiment, platform, and keyword analysis

---

## Benefits

### For individuals & researchers

- Quick pulse check on any topic without manual scrolling
- Wikipedia + live social context in one place
- Compare tools, brands, or frameworks

### For brands & marketing

- Brand perception across multiple platforms
- See which platform drives conversation (Reddit vs Bluesky vs news)
- CSV export for presentations
- Crisis Radar for early negative spikes

### For PR & communications

- Topic summaries and sentiment for briefings
- High negative sentiment alerts and PR strategy suggestions
- Evidence-backed talking points from real mentions

### For product & tech teams

- Track feedback on releases, features, and competitors
- Developer sources: GitHub, Hacker News, Dev.to, Stack Overflow
- Compare adoption buzz between technologies

### For students & portfolio demos

- Real full-stack product: auth, API, database, charts, search pipeline
- Suitable for capstone projects and SaaS-style demos

---

## Use cases

| Scenario | What you do | What you get |
|----------|-------------|--------------|
| **Product launch** | Search your product name | Sentiment %, praise/complaints, platform mix |
| **Competitor analysis** | Compare your brand vs competitor | Volume leader, sentiment leader, conclusion |
| **News / crisis monitoring** | Search crisis-related keywords | Volume, tone, trending words, source health |
| **Tech decision** | Compare "React" vs "Angular" | Mention counts, sentiment split, discussion themes |
| **Stakeholder demo** | Dashboard + Search + Compare | Live data, charts, professional export |
| **Research** | Search topic → Export CSV | Dataset of mentions with sentiment scores |

---

## Data sources

OpinionPulse aggregates from many channels so opinion is not limited to one network:

| Category | Sources |
|----------|---------|
| **Social** | Reddit, YouTube, Bluesky, Mastodon |
| **Tech** | GitHub, Hacker News, Dev.to, Stack Overflow |
| **News** | NewsAPI, The Guardian, GNews, Mediastack, Currents (API keys optional) |
| **Context** | Wikipedia REST API |

Some sources work **without API keys** (Reddit public, Hacker News, Dev.to). Others require keys in `opinionpulse-backend/.env.local`.

---

## Technology stack

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser  →  React + TypeScript (Vite)  →  localhost:5173  │
└────────────────────────────┬────────────────────────────────┘
                             │ REST API (JSON) + JWT
┌────────────────────────────▼────────────────────────────────┐
│  Python + FastAPI (Uvicorn)  →  localhost:8000              │
│  SQLAlchemy  →  MySQL / MariaDB (XAMPP)                      │
│  External APIs: Reddit, YouTube, News, Wikipedia, AI, etc.  │
└─────────────────────────────────────────────────────────────┘
```

---

### Core languages

| Language | Where used | Why we chose it |
|----------|------------|-----------------|
| **TypeScript** | Frontend (`opinionpulse-frontend`) | Catches bugs at build time; better IDE support; safer refactors for a large UI (search, compare, charts, chat). |
| **Python 3.9+** | Backend (`opinionpulse-backend`) | Strong for APIs, data processing, sentiment analysis, and social/news integrations. Fast to build search pipelines and AI hooks. |
| **SQL** | MySQL/MariaDB | Relational storage for users, search history, plans, mentions, and sessions. |

---

### Frontend stack

| Technology | Role | Why we use it |
|------------|------|----------------|
| **React 19** | UI framework | Component-based UI for dashboard, search, compare, chat. Large ecosystem; good for interactive charts and filters. |
| **Vite 8** | Build tool & dev server | Fast HMR and builds; excellent developer experience. |
| **TypeScript 6** | Type safety | Shared types for API responses reduce runtime errors. |
| **React Router 7** | Routing | Clean routes for public vs protected pages (`/search`, `/compare`, `/chat`, etc.). |
| **Tailwind CSS 4** | Styling | Utility-first styling for cards, filters, responsive layout. |
| **Recharts 3** | Charts | Sentiment trends, platform share, forecasts on Search and Compare. |
| **TanStack React Query 5** | Server state | Caching and refetch for dashboard, crisis radar, usage limits. |
| **React Hook Form + Zod** | Forms & validation | Sign-in, sign-up, settings with validated inputs. |
| **Lucide React** | Icons | Consistent iconography across the app. |
| **react-markdown** | Chat UI | Renders AI chat responses with formatting. |
| **Stripe.js** | Payments | Pro subscription checkout (SaaS billing). |

**Why React + TypeScript + Vite?**  
Modern SPA stack suited to dashboard products: many pages, charts, filters, and strong community/hiring support.

---

### Backend stack

| Technology | Role | Why we use it |
|------------|------|----------------|
| **FastAPI** | REST API framework | Async support for parallel source fetching; automatic OpenAPI docs; Pydantic validation. |
| **Uvicorn** | ASGI server | Runs FastAPI with good performance; `--reload` for development. |
| **Pydantic / pydantic-settings** | Schemas & config | Validates search/auth payloads; loads `.env.local` for secrets. |
| **SQLAlchemy 2** | ORM | Maps Python models to MySQL tables. |
| **PyMySQL** | MySQL driver | Works with XAMPP/MySQL on Windows and local dev. |
| **python-jose** | JWT tokens | Stateless auth for the SPA (Bearer token). |
| **bcrypt** | Password hashing | Secure password storage. |
| **VADER Sentiment** | Sentiment analysis | Rule-based NLP; no GPU required; fast for social text. |
| **requests** | HTTP client | Calls external APIs (Reddit, news, Wikipedia, etc.). |
| **PRAW** | Reddit API | Official Reddit wrapper when credentials are configured. |
| **Anthropic / Groq** | AI (optional) | Pulse AI chat and insights when API keys are set. |
| **APScheduler** | Background jobs | Scheduled scanning (pulse, crisis). |
| **Stripe (Python)** | Billing | Pro plan webhooks on the server. |
| **python-multipart** | Uploads | Profile/avatar uploads. |
| **email-validator** | Email validation | Sign-up and auth flows. |

**Why Python + FastAPI (not Node/Express or Django)?**

- Search needs **async I/O** (many external APIs per request).
- Python has strong **data/ML** libraries (VADER, future NLP).
- FastAPI is **lighter than Django** for an API-first SPA backend.

---

### Database & storage

| Technology | Role | Why we use it |
|------------|------|----------------|
| **MySQL / MariaDB** | Primary database | Familiar via XAMPP on Windows; stores users, sessions, search history, mentions, plans. |
| **utf8mb4** | Charset | Supports emojis and international text in posts. |

**Why SQL (not MongoDB only)?**  
User accounts, billing, search history, and user→search→mention relations fit a relational model well.

---

### Authentication & security

| Component | Purpose |
|-----------|---------|
| **JWT (Bearer tokens)** | SPA-friendly auth; token sent on each API request. |
| **HttpOnly cookies** | Optional session handoff (e.g. Google OAuth). |
| **Email OTP** | Verification and login without SMS cost. |
| **Google OAuth** | Optional one-click sign-in. |
| **bcrypt + rate limiting** | Password security and brute-force protection. |
| **CORS middleware** | Allows frontend (5173) to call backend (8000) in development. |

---

### External integrations

| Integration | Purpose |
|-------------|---------|
| Reddit, YouTube, Hacker News, Dev.to, GitHub, Stack Overflow, Bluesky, Mastodon | Social & tech opinion |
| NewsAPI, Guardian, GNews, Mediastack, Currents | News coverage |
| Wikipedia REST API | Topic context in summaries |
| Stripe | Subscriptions (Pro plan) |
| Anthropic / Groq | AI chat & insights (optional) |

---

### DevOps & tooling

| Tool | Purpose |
|------|---------|
| **Git / GitHub** | Version control; `Dev` branch for active development. |
| **ESLint** | Frontend code quality. |
| **pytest** | Backend tests (auth, search logic, topic summary). |
| **`.env.local`** | Secrets (DB, API keys) — not committed to git. |
| **Vite proxy** | Dev: `/api` → `127.0.0.1:8000` to avoid CORS issues. |
| **start-dev scripts** | Run backend + frontend together (Mac/Linux/Windows). |

---

### Why this stack fits OpinionPulse

| Requirement | Stack choice |
|-------------|--------------|
| Live search from 10+ APIs | FastAPI async + Python requests |
| Rich dashboard UI | React + Recharts + Tailwind |
| User accounts & billing | MySQL + JWT + Stripe |
| Sentiment without heavy ML ops | VADER (Python) |
| Optional AI features | Anthropic / Groq |
| Windows/XAMPP development | MySQL + PyMySQL + two-terminal setup |
| Type-safe frontend | TypeScript |
| Fast local development | Vite + Uvicorn `--reload` |

---

## Monorepo layout

```
opinionpulse/
├── opinionpulse-frontend/   → React + TypeScript + Vite
├── opinionpulse-backend/    → Python + FastAPI
├── docs/                    → Documentation (this file, AUTH_SETUP, SEARCH_SETUP)
├── scripts/                 → start-dev.sh / start-dev.ps1
├── START.md                 → Quick local setup guide
└── README.md                → Monorepo entry point
```

---

## How to run locally

See **[START.md](../START.md)** for full instructions. Summary:

1. **Start MySQL** (XAMPP on Windows).
2. **Backend config** — Copy `.env.example` to `.env.local` in `opinionpulse-backend/`.
3. **Terminal 1 — Backend:**
   ```bash
   cd opinionpulse-backend
   uvicorn app.main:app --reload --port 8000
   ```
4. **Terminal 2 — Frontend:**
   ```bash
   cd opinionpulse-frontend
   npm install
   npm run dev
   ```
5. Open **http://localhost:5173**, sign up/sign in, and search.

**Verify:**

- Backend health: http://127.0.0.1:8000/api/health
- DB health: http://127.0.0.1:8000/api/health/db
- App: http://localhost:5173/search

---

## One-line pitch

> **OpinionPulse turns scattered social and news chatter into clear sentiment, summaries, and comparisons — so you can understand public opinion in minutes instead of hours.**

---

## Related documentation

- [START.md](../START.md) — Local development setup
- [AUTH_SETUP.md](./AUTH_SETUP.md) — Authentication configuration
- [SEARCH_SETUP.md](./SEARCH_SETUP.md) — Search system architecture

---

*Last updated: August 2026 — OpinionPulse (Dev branch)*
