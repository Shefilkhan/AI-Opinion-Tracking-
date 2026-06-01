# OpinionPulse Authentication Setup

This project uses **React (Vite) + FastAPI + MySQL**, not Next.js/Prisma. The auth spec is implemented on that stack with equivalent behavior.

## Routes

| Frontend | Backend API |
|----------|-------------|
| `/auth/signup` | `POST /api/auth/signup` (alias `/register`) |
| `/auth/signin` | `POST /api/auth/signin` (alias `/login`) |
| `/auth/verify-otp` | `POST /api/auth/verify-otp` |
| `/auth/forgot-password` → `/auth/verify-otp?type=password_reset` → `/auth/reset-password` | `POST /api/auth/forgot-password`, `POST /api/auth/verify-password-reset-otp`, `POST /api/auth/reset-password` |
| Protected: `/dashboard`, `/settings`, … | `GET /api/auth/me`, `POST /api/auth/logout` |

Legacy `/login`, `/signup`, `/verify-*-otp` redirect to the `/auth/*` paths.

## Environment variables

### Backend (`opinionpulse-backend/.env` or `.env.local`)

Pydantic loads **both** `.env` and `.env.local` (use `.env.local` for Gmail secrets).

| Variable | Required | How to get it |
|----------|----------|---------------|
| `SECRET_KEY` | Yes | Random string **≥ 32 characters** (e.g. `openssl rand -hex 32`) |
| `OTP_SECRET` | Yes | Separate random pepper for OTP hashing (e.g. `openssl rand -hex 24`) |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Yes | Your MySQL/XAMPP credentials |
| `EMAIL_USER` | For real email | Your Gmail address (preferred) |
| `EMAIL_APP_PASSWORD` | For real email | **Gmail App Password** (spaces stripped automatically) |
| `SMTP_HOST` | Optional | Defaults to `smtp.gmail.com` |
| `SMTP_PORT` | Optional | Defaults to `587` |
| `SMTP_USER` / `SMTP_PASSWORD` | Alt names | Same as `EMAIL_USER` / `EMAIL_APP_PASSWORD` |
| `SMTP_FROM_EMAIL` | Optional | Defaults to `EMAIL_USER` |
| `SMTP_FROM_NAME` | Optional | `OpinionPulse` |
| `FRONTEND_URL` | Optional | `http://localhost:5173` (CORS already allows this origin) |
| `AUTH_COOKIE_SECURE` | Production | `true` when using HTTPS |
| `APP_ENV` | Optional | `development` enables dev OTP in API when SMTP is missing |

Optional tuning: `OTP_EXPIRE_MINUTES=2`, `OTP_MAX_ATTEMPTS=3`, `LOGIN_MAX_FAILED_ATTEMPTS=5`, `LOGIN_LOCKOUT_MINUTES=15`, `ACCESS_TOKEN_EXPIRE_DAYS=7`.

### Frontend (`opinionpulse-frontend/.env`)

| Variable | Required | How to get it |
|----------|----------|---------------|
| `VITE_API_BASE_URL` | Yes | `http://localhost:8000` (FastAPI URL) |

## Gmail App Password (SMTP)

1. Sign in to [Google Account](https://myaccount.google.com/).
2. Enable **2-Step Verification** (Security).
3. Open **App passwords** (search in account settings).
4. Create an app → Mail → Other → name it `OpinionPulse`.
5. Copy the 16-character password into `EMAIL_APP_PASSWORD` in `.env.local` (spaces optional).

If email is not configured and `APP_ENV=development`, the API may return `dev_otp_code` and the UI shows `DevOtpBanner` **only in Vite dev builds** (`import.meta.env.DEV`). Production builds never show the on-screen OTP. When SMTP is configured but send fails, the API returns `503` with: `Failed to send verification email. Please try again.` (check the backend terminal for `EMAIL ERROR:` logs).

## Run locally

You need **both** servers running. If only the frontend is up, signup/signin will show a network error.

```bash
# Terminal 1 — Backend (FastAPI on port 8000)
cd opinionpulse/opinionpulse-backend
python -m venv venv
# Windows: .\venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env   # edit DB_PASSWORD if needed
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Terminal 2 — Frontend (Vite on port 5173, proxies /api to backend)
cd opinionpulse/opinionpulse-frontend
npm install
npm run dev
```

On startup, the backend logs `ENV CHECK:` with which settings are configured. Ensure MySQL/XAMPP is running.

On first dev start, SQLAlchemy creates tables; `schema_sync` adds new user columns. For manual SQL, run `scripts/migrate_auth_system.sql`.

## Security notes

- Passwords: bcrypt (12 rounds).
- OTP: HMAC-SHA256 with `OTP_SECRET` (2-minute expiry, 3 attempts).
- JWT: 7-day session in **httpOnly** cookie `opinionpulse_token` + optional Bearer header.
- Rate limits: in-memory per IP/email on signup, signin, verify, resend.
- Login lockout: 5 failures → 15-minute lock.
