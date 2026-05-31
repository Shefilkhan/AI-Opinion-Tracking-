# OpinionPulse Backend

FastAPI service for opinion tracking, sentiment analysis, chat, reports, and alerts.

## Setup

```bash
cd opinionpulse/opinionpulse-backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
copy .env.example .env
```

Edit `.env` with MySQL credentials and optional API keys.

## Run

```bash
uvicorn app.main:app --reload
```

- **API docs:** http://localhost:8000/docs  
- **Health:** http://localhost:8000/api/health  

## Environment (`.env.example`)

| Key | Description |
|-----|-------------|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | XAMPP MySQL |
| `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT |
| `YOUTUBE_API_KEY`, `YOUTUBE_MAX_*` | YouTube collection |
| `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, etc. | Reddit collection |

## Migration scripts (`scripts/`)

| Script | Purpose |
|--------|---------|
| `migrate_users_auth.sql` | Users / auth |
| `migrate_part5.sql` | Core project tables |
| `migrate_part6.sql` | Mentions extensions |
| `migrate_part7.sql` | Sentiment results |
| `migrate_part10_chat.sql` | Chat sessions/messages |
| `migrate_part10_reports.sql` | Reports table |
| `migrate_part10_alerts.sql` | Alerts table |

In `APP_ENV=development`, missing tables are also created via SQLAlchemy `create_all`.

## Main API groups

- `/api/auth` — register, login, me  
- `/api/projects` — projects CRUD  
- `/api/projects/{id}/keywords`, `/sources`, `/mentions`  
- `/api/projects/{id}/sentiment`, `/analytics`  
- `/api/projects/{id}/collection` — GDELT, YouTube, Reddit  
- `/api/projects/{id}/chat` — AI assistant  
- `/api/projects/{id}/reports` — reports & CSV export  
- `/api/projects/{id}/alerts` — alert rules & evaluate  

All project-scoped routes require `Authorization: Bearer <token>` and enforce ownership.

## Project layout

```
app/
  api/routes/     # HTTP endpoints
  services/       # Business logic
  schemas/        # Pydantic models
  db/models.py    # SQLAlchemy models
  main.py         # App entry
```
