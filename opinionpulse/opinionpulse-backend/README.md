# OpinionPulse Backend

FastAPI backend with SQLAlchemy and XAMPP MySQL/MariaDB.

## Prerequisites

1. **XAMPP** — Start **MySQL** in XAMPP Control Panel.
2. **Database** — Create `opinionpulse_db` in phpMyAdmin (`http://localhost/phpmyadmin`) or run:

```sql
CREATE DATABASE IF NOT EXISTS opinionpulse_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

See [`scripts/init_db.sql`](scripts/init_db.sql).

## Setup

```bash
cd opinionpulse-backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Edit `.env` if your MySQL user/password differs from default XAMPP (`root` with empty password).

## Run

```bash
uvicorn app.main:app --reload
```

- API: http://localhost:8000
- Docs: http://localhost:8000/docs

## Health checks

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | API running |
| `GET /api/health/db` | MySQL connection test |

## Project layout

```
app/
  main.py           # FastAPI app, CORS, table creation (dev)
  core/config.py    # Environment settings
  db/database.py    # Engine, SessionLocal, get_db
  db/models.py      # User, Project, Keyword, Source, Mention, etc.
  api/routes/health.py
```

Tables are auto-created on startup when `APP_ENV=development`.
