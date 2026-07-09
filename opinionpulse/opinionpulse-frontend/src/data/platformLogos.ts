import { platformBrandColor } from "@/lib/platformBrandColors"

export type PlatformLogo = {
  id: string
  name: string
  color: string
}

/** Platforms OpinionPulse collects data from via API integrations. */
export const platformLogos: PlatformLogo[] = [
  { id: "reddit", name: "Reddit", color: platformBrandColor("reddit") },
  { id: "youtube", name: "YouTube", color: platformBrandColor("youtube") },
  { id: "hackernews", name: "Hacker News", color: platformBrandColor("hackernews") },
  { id: "devto", name: "Dev.to", color: platformBrandColor("devto") },
  { id: "newsapi", name: "NewsAPI", color: platformBrandColor("newsapi") },
  { id: "guardian", name: "The Guardian", color: platformBrandColor("guardian") },
  { id: "bluesky", name: "Bluesky", color: platformBrandColor("bluesky") },
  { id: "mastodon", name: "Mastodon", color: platformBrandColor("mastodon") },
  { id: "github", name: "GitHub", color: platformBrandColor("github") },
  { id: "stackoverflow", name: "Stack Overflow", color: platformBrandColor("stackoverflow") },
  { id: "wikipedia", name: "Wikipedia", color: platformBrandColor("wikipedia") },
  { id: "gnews", name: "GNews", color: platformBrandColor("gnews") },
  { id: "currents", name: "Currents", color: platformBrandColor("currents") },
]
