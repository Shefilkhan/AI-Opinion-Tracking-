# OpinionPulse

AI-powered opinion tracking SaaS for monitoring public sentiment across Reddit, YouTube, GDELT news, and manual mentions — with VADER sentiment analysis, analytics, a rule-based AI assistant, reports, and in-app alerts.

**Final-year project · Dev branch · No paid LLM APIs**

## Features

| Module | Description |
|--------|-------------|
| **Auth** | JWT signup/login, protected dashboard |
| **Projects** | CRUD, keywords, source toggles |
| **Collection** | GDELT, YouTube, Reddit mention ingestion |
| **Sentiment** | VADER analysis, trends, filters |
| **Analytics** | Overview, source breakdown, top mentions |
| **AI Assistant** | Template/rule-based Q&A over project data |
| **Reports** | Generated summaries, CSV export, print |
| **Alerts** | Negative %, volume, keyword, source rules (in-app) |

## Tech stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS v4, shadcn/ui, TanStack Query, Recharts
- **Backend:** FastAPI, SQLAlchemy, PyMySQL, Pydantic, JWT
- **Database:** MySQL / MariaDB (XAMPP)
- **NLP:** VADER (no OpenAI / external LLM)

## Folder structure

```
AI-Opinion-Tracking-/
  docs/
    demo-script.md
    final-testing-checklist.md
  opinionpulse/
    opinionpulse-frontend/   # React app
    opinionpulse-backend/    # FastAPI API
```

## Setup

### 1. Database (XAMPP)

1. Start **MySQL** in XAMPP Control Panel.
2. Open http://localhost/phpmyadmin
3. Create database **`opinionpulse_db`** (utf8mb4), or let the backend create it in development.

### 2. Migrations (optional)

In phpMyAdmin, run scripts under `opinionpulse/opinionpulse-backend/scripts/` as needed:

- `migrate_users_auth.sql`
- `migrate_part5.sql` … `migrate_part7.sql`
- `migrate_part10_chat.sql`
- `migrate_part10_reports.sql`
- `migrate_part10_alerts.sql`

In **development**, `Base.metadata.create_all()` also creates missing tables on startup.

### 3. Backend

```bash
cd opinionpulse/opinionpulse-backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# Edit .env — DB credentials, SECRET_KEY, optional API keys
uvicorn app.main:app --reload
```

- API: http://localhost:8000  
- Docs: http://localhost:8000/docs  
- Health: http://localhost:8000/api/health  

### 4. Frontend

```bash
cd opinionpulse/opinionpulse-frontend
npm install
npm run dev
```

- App: http://localhost:5173  
- Set `VITE_API_BASE_URL=http://localhost:8000` in `.env` if needed.

## Environment variables (backend)

See `opinionpulse/opinionpulse-backend/.env.example`:

| Variable | Purpose |
|----------|---------|
| `DB_*` | MySQL connection |
| `SECRET_KEY` | JWT signing |
| `YOUTUBE_API_KEY` | YouTube comment collection |
| `REDDIT_*` | Reddit API (PRAW) |

GDELT does not require an API key.

## Demo flow

1. Sign up / log in  
2. Create project → keywords → enable sources  
3. Collect GDELT / YouTube / Reddit  
4. **Analyze Sentiment**  
5. Review analytics on project page  
6. **AI Opinion Assistant** — ask summary / complaints / comparison  
7. **View Reports** — generate, export CSV, print  
8. **View Alerts** — create rules, evaluate  

Full script: [docs/demo-script.md](docs/demo-script.md)  
Testing: [docs/final-testing-checklist.md](docs/final-testing-checklist.md)

## API keys

- **YouTube:** Google Cloud Console → YouTube Data API v3  
- **Reddit:** https://www.reddit.com/prefs/apps (script app)  
- **GDELT:** none  

Never commit `.env` or expose keys to the frontend.

## Known limitations

- Rule-based assistant (not GPT)
- Alerts are in-app only (no email/Slack)
- GDELT rate limits (429) possible
- Collection depends on third-party APIs and quotas

## Future improvements

- Scheduled collection jobs
- Email/webhook alerts
- Optional local LLM for chat
- Team workspaces and roles

## More detail

- [opinionpulse/README.md](opinionpulse/README.md)  
- [opinionpulse/opinionpulse-backend/README.md](opinionpulse/opinionpulse-backend/README.md)  
- [opinionpulse/opinionpulse-frontend/README.md](opinionpulse/opinionpulse-frontend/README.md)
