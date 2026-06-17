/** Platform brand colors for overlapping dots in the topics table */
export const PLATFORM_BRAND_COLORS: Record<string, string> = {
  reddit: "#FF4500",
  youtube: "#FF0000",
  guardian: "#052962",
  newsapi: "#2563EB",
  news: "#2563EB",
  hackernews: "#FF6600",
  devto: "#7C3AED",
  gnews: "#1A73E8",
  currents: "#A855F7",
  mediastack: "#EF4444",
  wikipedia: "#636466",
  mastodon: "#6364FF",
  github: "#181717",
  stackoverflow: "#F48024",
  bluesky: "#1185FE",
}

export function platformBrandColor(platform: string): string {
  return PLATFORM_BRAND_COLORS[platform.toLowerCase()] ?? "var(--dash-text-faint)"
}
