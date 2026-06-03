/**
 * Search data is fetched server-side (FastAPI) via POST /api/search.
 * Platform integrations live in opinionpulse-backend/app/services/platforms/.
 */
export const FREE_API_SOURCES = [
  "reddit",
  "newsapi",
  "youtube",
  "guardian",
  "mediastack",
  "currents",
  "gnews",
  "devto",
  "hackernews",
  "wikipedia",
] as const
