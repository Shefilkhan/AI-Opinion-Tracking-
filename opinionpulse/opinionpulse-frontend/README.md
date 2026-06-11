# OpinionPulse Frontend

React + Vite + TypeScript dashboard for OpinionPulse.

## Setup

```bash
cd opinionpulse/opinionpulse-frontend
npm install
```

Optional `.env`:

```
VITE_API_BASE_URL=http://localhost:8000
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server http://localhost:5173 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |

## Routes

| Path | Page |
|------|------|
| `/` | Landing |
| `/login`, `/signup` | Auth |
| `/dashboard` | Dashboard |
| `/projects` | Project list |
| `/projects/new` | Create project |
| `/projects/:id` | Project detail (analytics, mentions, collection) |
| `/projects/:id/chat` | AI Opinion Assistant |
| `/projects/:id/reports` | Reports & CSV export |
| `/projects/:id/alerts` | Alert rules & evaluation |

Protected routes use `ProtectedRoute` + JWT in `localStorage`.

## Main areas

```
src/
  api/              # API clients (auth, projects, mentions, analytics, chat, reports, alerts)
  components/
    layout/         # DashboardLayout, sidebar
    projects/       # Keywords, sources, forms
    mentions/       # Feed, filters, cards
    analytics/      # Charts and overview
    sentiment/      # Analyze button, badges
    collection/     # GDELT / YouTube / Reddit
    chat/           # Assistant UI
    reports/        # Report preview, export, print
    alerts/         # Alert form, list, evaluation
  pages/            # Route pages
```

## UI

- Tailwind CSS v4, shadcn/ui  
- Dark navy theme, blue/violet accents  
- Print styles for reports in `src/index.css`  

## Backend

Start the API before using the dashboard. See [../opinionpulse-backend/README.md](../opinionpulse-backend/README.md).
