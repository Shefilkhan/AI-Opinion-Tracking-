# OpinionPulse — Final Testing Checklist

Run before submission or viva. Check each box when verified.

## Environment

- [ ] XAMPP MySQL running
- [ ] Database `opinionpulse_db` exists
- [ ] Migrations applied (or dev `create_all` on startup)
- [ ] Backend: `uvicorn app.main:app --reload` — no errors
- [ ] Frontend: `npm run dev` — no errors
- [ ] `npm run build` succeeds

## Auth

- [ ] Sign up creates user
- [ ] Login returns token
- [ ] Protected routes redirect when logged out
- [ ] Invalid credentials show error

## Projects

- [ ] Create / list / update / delete project
- [ ] Cannot access another user's project (404)

## Keywords & sources

- [ ] Add / remove keywords
- [ ] Enable / disable sources per project

## Mentions

- [ ] Manual mention create
- [ ] Mention feed filters (source, sentiment, search)
- [ ] Seed mentions (if used for demo)

## Collection

- [ ] GDELT collection returns results (or graceful empty/rate-limit message)
- [ ] YouTube collection with valid API key
- [ ] Reddit collection with valid credentials
- [ ] Duplicate mentions not duplicated incorrectly

## Sentiment

- [ ] Analyze sentiment on project
- [ ] Badges on mentions
- [ ] Summary and trends on project detail
- [ ] Project with mentions but no analysis shows appropriate empty states

## Analytics

- [ ] Overview cards load
- [ ] Source sentiment chart
- [ ] Distribution chart
- [ ] Top positive / negative mentions

## Chatbot

- [ ] `/projects/:id/chat` loads
- [ ] Summary, complaints, positive, comparison intents
- [ ] Sessions persist after refresh
- [ ] Delete session works
- [ ] No mentions / no sentiment messages correct

## Reports

- [ ] Generate custom/daily/weekly/monthly report
- [ ] Report history list and view
- [ ] Delete report
- [ ] Export mentions CSV — columns correct
- [ ] Export sentiment CSV — columns correct
- [ ] Print layout hides nav/actions

## Alerts

- [ ] Create all four alert types
- [ ] Evaluate alerts — messages accurate
- [ ] Enable / disable alert
- [ ] Delete alert
- [ ] `last_triggered_at` updates when triggered

## Security

- [ ] JWT required on API routes
- [ ] Cannot read another user's chat session / report / alert by ID

## UI polish

- [ ] Sidebar links work (Dashboard, Projects, AI Assistant, Reports, Alerts)
- [ ] Mobile nav sheet works
- [ ] Loading and error states visible
- [ ] Long mention text does not break layout

## Documentation

- [ ] Root README accurate
- [ ] Backend README accurate
- [ ] Frontend README accurate
- [ ] Demo script reviewed
