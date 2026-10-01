# AGENTS.md

## Cursor Cloud specific instructions

OpinionPulse is a full-stack app. The **canonical** code lives under `opinionpulse/`:
`opinionpulse/opinionpulse-backend` (FastAPI) and `opinionpulse/opinionpulse-frontend` (React + Vite).
The top-level `opinionpulse-frontend/` directory is a stale/partial duplicate — ignore it.

### Services

| Service | Directory | Run (dev) | Port |
|---------|-----------|-----------|------|
| MariaDB (MySQL) | — | see "Database" below | 3306 |
| Backend API (FastAPI) | `opinionpulse/opinionpulse-backend` | `./venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8000` | 8000 |
| Frontend (Vite) | `opinionpulse/opinionpulse-frontend` | `npm run dev` | 5173 |

The Vite dev server proxies `/api` and `/uploads` to `http://127.0.0.1:8000`, so start the backend first. No `VITE_API_BASE_URL` is needed in dev.

### Database (must be started each session)

MariaDB is installed at the system level (persisted in the VM snapshot) but is **not** a
managed service here, so it must be started manually and is not covered by the update script:

```
sudo mkdir -p /run/mysqld && sudo chown mysql:mysql /run/mysqld
sudo mariadbd --user=mysql &
```

A dev DB user already exists: `opinionpulse` / password `opinionpulse` (full privileges).
In `APP_ENV=development` the backend auto-creates the `opinionpulse_db` database and all
tables on startup (`Base.metadata.create_all` + `ensure_*_schema` in the lifespan), so no
manual migrations are needed.

Note: the client resolves `127.0.0.1` to hostname `localhost`, and the default `root@localhost`
uses unix_socket auth — that is why a dedicated password user (`opinionpulse`) is used for TCP.

### Backend config

`opinionpulse/opinionpulse-backend/.env.local` holds dev config (gitignored) — DB creds point
at the local MariaDB user above, plus dev `SECRET_KEY`/`OTP_SECRET`. All external API keys
(Groq, YouTube, Reddit, News, Stripe, Google OAuth, SMTP, etc.) are optional; those features
degrade gracefully when unset. Live search still returns real results from unauthenticated
sources (Reddit RSS, Hacker News, Wikipedia, Dev.to, etc.).

### Auth / OTP (dev)

Signup **and** login both require an emailed 6-digit OTP. With SMTP unconfigured (dev), the OTP
is returned in the API response as `dev_otp_code` and shown in a green "Development mode" banner
on the verify screen. `.env.local` sets `OTP_EXPIRE_MINUTES=30` and `OTP_MAX_ATTEMPTS=10` for
easier manual/agent testing. `verify-otp` requires a `type` field (`signup` | `login`).
A no-auth live-search demo is available at `/explore` (public demo endpoint).

### Lint / test / build

- Frontend lint: `npm run lint` in the frontend dir. NOTE: the repo currently has pre-existing
  ESLint errors/warnings unrelated to environment setup — a nonzero result is expected.
- Backend tests: `./venv/bin/python -m pytest` in the backend dir. Tests use in-memory SQLite
  (see `tests/conftest.py`), so **MariaDB is not required for tests**. One pre-existing test
  (`test_dashboard_overview_ok_with_mocked_fetchers`) fails due to a stale attribute reference
  in the test, not an environment issue.
- Frontend build: `npm run build` (runs `tsc -b && vite build`).
