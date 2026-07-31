# Local development — quick start

Search and chat require **both** the backend (port 8000) and frontend (port 5173), plus **MySQL** (XAMPP on Windows).

## 1. Database (XAMPP / MySQL)

1. Open **XAMPP** → start **MySQL**
2. Create database `opinionpulse_db` (phpMyAdmin) or let the app create it on first run

## 2. Backend config

```bash
cd opinionpulse-backend
copy .env.example .env.local    # Windows
# cp .env.example .env.local    # Mac/Linux
```

Edit `.env.local`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=          # XAMPP default is often empty
DB_NAME=opinionpulse_db
SECRET_KEY=any_random_32_char_string
OTP_SECRET=any_random_secret
```

## 3. Run (two terminals)

**Terminal 1 — Backend:**

```bash
cd opinionpulse-backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt   # Windows
# .venv/bin/pip install -r requirements.txt     # Mac/Linux
.venv\Scripts\uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Frontend:**

```bash
cd opinionpulse-frontend
npm install
npm run dev
```

Or on Mac/Linux: `bash scripts/start-dev.sh`

## 4. Verify

- Backend health: http://127.0.0.1:8000/api/health → `{"status":"ok"}`
- DB health: http://127.0.0.1:8000/api/health/db → `{"database":"connected"}`
- App: http://localhost:5173/search

## Search stuck on “Searching live sources…”?

Usually means the backend or MySQL is not running. Check:

1. Backend terminal for errors
2. Browser DevTools → Network → `POST /api/search` (pending = backend down; 401 = sign in again)
