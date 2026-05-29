# OpinionPulse

AI-powered opinion tracking SaaS — final-year project.

## Structure

```
opinionpulse/
  opinionpulse-frontend/   # React + Vite + TypeScript
  opinionpulse-backend/    # FastAPI + SQLAlchemy + MySQL
```

## Quick start

### 1. Database (XAMPP)

1. Start **MySQL** in XAMPP.
2. Create database `opinionpulse_db` in phpMyAdmin.

### 2. Backend

```bash
cd opinionpulse-backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 3. Frontend

```bash
cd opinionpulse-frontend
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API docs: http://localhost:8000/docs

## Progress

| Part | Status |
|------|--------|
| Landing page + frontend template | Done |
| FastAPI + MySQL foundation | Done |
| Auth, CRUD, APIs, sentiment, chatbot | Planned |
