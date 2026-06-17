/** Platform indicator dots for dashboard ranked lists */

const PLATFORM_DOT: Record<string, string> = {
  reddit: "var(--dash-neg)",
  youtube: "var(--dash-neg)",
  hackernews: "var(--dash-blue)",
  devto: "var(--dash-accent)",
  github: "#6E7681",
  stackoverflow: "var(--dash-blue)",
  news: "var(--dash-blue)",
  newsapi: "var(--dash-blue)",
  guardian: "var(--dash-blue)",
  mastodon: "var(--dash-accent)",
  bluesky: "#1185FE",
}

export function platformDotColor(platform: string): string {
  const key = platform.toLowerCase()
  return PLATFORM_DOT[key] ?? "var(--dash-neu)"
}

export function platformLabel(platform: string): string {
  const labels: Record<string, string> = {
    hackernews: "HN",
    stackoverflow: "SO",
    newsapi: "News",
  }
  return labels[platform.toLowerCase()] ?? platform
}
