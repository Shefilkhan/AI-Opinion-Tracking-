# OpinionPulse

AI-powered opinion tracking with sentiment analysis and a public opinion chatbot.

## Project structure

```
opinionpulse/
  opinionpulse-frontend/   # React + Vite (Part 1 ✅)
  opinionpulse-backend/    # FastAPI + MySQL (Part 2–3 ✅)
```

> If you still have `opinionpulse-frontend/` at the repo root (from an earlier setup), use `opinionpulse/opinionpulse-frontend/` instead and remove the root copy after stopping `npm run dev`.

## Quick start

### Database (XAMPP)

1. Start **MySQL** in XAMPP Control Panel.
2. Open http://localhost/phpmyadmin
3. Create database: **opinionpulse_db**

### Backend

```bash
cd opinionpulse/opinionpulse-backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Test: http://localhost:8000/api/health and http://localhost:8000/docs

### Frontend

```bash
cd opinionpulse/opinionpulse-frontend
npm install
npm run dev
```

Open http://localhost:5173/dashboard to see **Backend Status: Connected** when the API is running.

## Progress

| Part | Module | Status |
|------|--------|--------|
| 1 | Landing page + frontend template | ✅ |
| 2 | FastAPI backend setup | ✅ |
| 3 | XAMPP MySQL + models | ✅ |
| 4+ | Auth, CRUD, APIs, sentiment, chatbot | Later |

See [opinionpulse/README.md](opinionpulse/README.md) for more detail.
