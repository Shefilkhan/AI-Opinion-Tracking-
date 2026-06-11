# OpinionPulse — Demo Presentation Script

Use this flow for a final-year project demo (about 12–15 minutes).

## 1. Landing page

- Open `http://localhost:5173`
- Highlight: problem statement, multi-source tracking, sentiment, AI assistant, reports, alerts
- Mention: no paid LLM APIs — rule-based assistant and templates

## 2. Sign up / log in

- Create a demo account or log in
- Show JWT-protected dashboard

## 3. Create a project

- **Projects** → **New project**
- Name example: `iPhone 16 Opinion Tracking`
- Add description and tracking frequency

## 4. Keywords and sources

- Open the project
- Add keywords: `iPhone 16`, `Apple phone`, `iOS`
- Enable sources: Reddit, YouTube, GDELT (as configured)

## 5. Collect data

- **Collect data** → GDELT (no API key)
- **Collect data** → YouTube (requires `YOUTUBE_API_KEY`)
- **Collect data** → Reddit (requires Reddit API credentials)
- Show mention feed updating

## 6. Analyze sentiment

- Click **Analyze Sentiment**
- Show sentiment badges on mentions
- Open analytics: overview cards, distribution chart, source sentiment, trends

## 7. AI Opinion Assistant

- **Ask AI Opinion Assistant** → `/projects/:id/chat`
- Ask suggested questions:
  - What are people saying overall?
  - What are the top complaints?
  - Compare Reddit and YouTube sentiment
- Show supporting mentions and session history

## 8. Reports and export

- **View Reports** → generate **Custom** report
- Walk through summary, source breakdown, top mentions
- **Export Mentions CSV** and **Export Sentiment CSV**
- **Print Report** (browser print preview)

## 9. Alerts

- **View Alerts** → create rules:
  - Negative sentiment ≥ 30%
  - High volume ≥ 50 mentions
  - Keyword `price` ≥ 5 mentions
  - Reddit source ≥ 20 mentions
- Click **Evaluate alerts**
- Explain triggered vs not triggered messages

## 10. Wrap-up

- Recap stack: React, FastAPI, MySQL, VADER, GDELT/YouTube/Reddit
- Note limitations: in-app alerts only, template-based AI, API rate limits
- Future: scheduled collection, email alerts, optional local LLM
