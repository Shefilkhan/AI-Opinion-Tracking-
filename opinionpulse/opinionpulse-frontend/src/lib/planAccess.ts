/** Map search filter values to underlying API source IDs. */
export const PLATFORM_FILTER_SOURCES: Record<string, string[]> = {
  all: [
    "reddit",
    "youtube",
    "mastodon",
    "bluesky",
    "devto",
    "hackernews",
    "github",
    "stackoverflow",
    "newsapi",
    "guardian",
    "mediastack",
    "currents",
    "gnews",
  ],
  reddit: ["reddit"],
  youtube: ["youtube"],
  mastodon: ["mastodon"],
  bluesky: ["bluesky"],
  github: ["github"],
  stackoverflow: ["stackoverflow"],
  tech: ["devto", "hackernews", "github", "stackoverflow"],
  news: ["newsapi", "guardian", "mediastack", "currents", "gnews"],
}

export function isPlatformFilterLocked(
  platform: string,
  allowed: string[] | "all" | undefined
): boolean {
  if (!allowed || allowed === "all") return false
  const sources = PLATFORM_FILTER_SOURCES[platform] ?? [platform]
  return !sources.some((s) => allowed.includes(s))
}

export function isTimeRangeLocked(
  timeRange: string,
  maxDays: number | undefined
): boolean {
  if (!maxDays || maxDays === -1) return false
  const days: Record<string, number> = { "24h": 1, "7d": 7, "30d": 30 }
  return (days[timeRange] ?? 1) > maxDays
}
