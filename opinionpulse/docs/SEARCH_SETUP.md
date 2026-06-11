# OpinionPulse Search System

## Architecture

- **Dashboard** (`/dashboard`) — trending topics, debates, platform pulse, recent searches (localStorage)
- **Search** (`/search?q=topic`) — core opinion search with filters, charts, and results feed
- **Reports** (`/reports`) — search history from DB with CSV export
- **Alerts** (`/alerts`) — UI for keyword alerts (stored locally until backend jobs are added)

Projects have been removed. Auth and Settings are unchanged.

## Database migration

Run once in phpMyAdmin or MySQL CLI (backup first):

```bash
mysql -u root opinionpulse_db < opinionpulse/opinionpulse-backend/scripts/migrate_to_search_system.sql
```

This drops `projects` and related tables and creates `search_history` / `saved_searches`.

Restart the backend after migrating so SQLAlchemy `create_all` aligns with the new models.

## API keys (optional)

Add to `opinionpulse-backend/.env` or `.env.local`:

```env
TWITTER_BEARER_TOKEN=
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_USER_AGENT=OpinionPulse/1.0
NEWS_API_KEY=
OPENAI_API_KEY=
```

Without keys, `POST /api/search` returns realistic **demo mock data** and the UI shows a demo-mode banner.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard/overview` | Dashboard stats and trending data |
| POST | `/api/search` | Search opinions (body: query, platform, time_range, sentiment, sort_by) |
| GET | `/api/search/history` | User search history for Reports |
