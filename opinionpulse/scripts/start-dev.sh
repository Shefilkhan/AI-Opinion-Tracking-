#!/usr/bin/env bash
# Start OpinionPulse backend + frontend for local development.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/opinionpulse-backend"
FRONTEND="$ROOT/opinionpulse-frontend"

echo "==> OpinionPulse dev stack"

# Backend env
if [[ ! -f "$BACKEND/.env.local" ]]; then
  echo "Creating $BACKEND/.env.local from .env.example ..."
  cp "$BACKEND/.env.example" "$BACKEND/.env.local"
  echo "   Edit DB_PASSWORD in .env.local if MySQL uses a password (XAMPP default is often empty)."
fi

# Python venv
if [[ ! -d "$BACKEND/.venv" ]]; then
  echo "==> Creating Python venv ..."
  python3 -m venv "$BACKEND/.venv"
  "$BACKEND/.venv/bin/pip" install -r "$BACKEND/requirements.txt"
fi

# Frontend deps
if [[ ! -d "$FRONTEND/node_modules" ]]; then
  echo "==> Installing frontend dependencies ..."
  (cd "$FRONTEND" && npm install)
fi

# MySQL hint
if ! (command -v mysql >/dev/null 2>&1); then
  echo "WARNING: mysql client not found. Ensure MySQL/MariaDB/XAMPP is running on port 3306."
else
  echo "==> Checking database connection ..."
  if ! curl -sf http://127.0.0.1:8000/api/health/db >/dev/null 2>&1; then
    echo "   (DB check will run after backend starts)"
  fi
fi

echo ""
echo "Starting backend on http://127.0.0.1:8000"
echo "Starting frontend on http://127.0.0.1:5173"
echo "Press Ctrl+C to stop both."
echo ""

trap 'kill 0' EXIT INT TERM

(cd "$BACKEND" && .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload) &
(cd "$FRONTEND" && npm run dev -- --host 127.0.0.1 --port 5173) &

wait
