# OpinionPulse Authentication Setup

This project uses **React (Vite) + FastAPI + MySQL**, not Next.js/Prisma. The auth spec is implemented on that stack with equivalent behavior.

## Routes

| Frontend | Backend API |
|----------|-------------|
| `/auth/signup` | `POST /api/auth/signup` (alias `/register`) |
| `/auth/signin` | `POST /api/auth/signin` (alias `/login`) |
| `/auth/verify-otp` | `POST /api/auth/verify-otp` |
| `/auth/forgot-password` | `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` |
| Protected: `/dashboard`, `/settings`, … | `GET /api/auth/me`, `POST /api/auth/logout` |

Legacy `/login`, `/signup`, `/verify-*-otp` redirect to the `/auth/*` paths.

## Environment variables

### Backend (`opinionpulse-backend/.env`)

| Variable | Required | How to get it |
|----------|----------|---------------|
| `SECRET_KEY` | Yes | Random string **≥ 32 characters** (e.g. `openssl rand -hex 32`) |
| `OTP_SECRET` | Yes | Separate random pepper for OTP hashing (e.g. `openssl rand -hex 24`) |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Yes | Your MySQL/XAMPP credentials |
| `SMTP_HOST` | For real email | `smtp.gmail.com` for Gmail |
| `SMTP_PORT` | For real email | `587` |
| `SMTP_USER` | For real email | Your Gmail address |
| `SMTP_PASSWORD` | For real email | **Gmail App Password** (see below) |
| `SMTP_FROM_EMAIL` | Recommended | Same as `SMTP_USER` |
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
5. Copy the 16-character password into `SMTP_PASSWORD` (spaces optional).

Without SMTP, development mode shows the OTP on screen (`DevOtpBanner`) and logs `[OpinionPulse DEV OTP]` in the backend terminal.

## Run locally

```bash
# Backend
cd opinionpulse/opinionpulse-backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd opinionpulse/opinionpulse-frontend
npm install
npm run dev
```

On first dev start, SQLAlchemy creates tables; `schema_sync` adds new user columns. For manual SQL, run `scripts/migrate_auth_system.sql`.

## Security notes

- Passwords: bcrypt (12 rounds).
- OTP: HMAC-SHA256 with `OTP_SECRET` (2-minute expiry, 3 attempts).
- JWT: 7-day session in **httpOnly** cookie `opinionpulse_token` + optional Bearer header.
- Rate limits: in-memory per IP/email on signup, signin, verify, resend.
- Login lockout: 5 failures → 15-minute lock.
