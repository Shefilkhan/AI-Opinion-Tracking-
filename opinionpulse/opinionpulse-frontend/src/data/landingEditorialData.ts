import type { LucideIcon } from "lucide-react"
import { Brain, Scale, Search, TrendingUp } from "lucide-react"
import { comparisonRows } from "@/data/pricingData"

/** Photography matched to the editorial landing reference (landscapes + minimal 3D). */
export const editorialImages = {
  heroLandscape:
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1400&q=80",
  canyon:
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=80",
  cylinders:
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=900&q=80",
  stones:
    "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=900&q=80",
  coastal:
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=80",
} as const

export const editorialNavLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#steps" },
  { label: "Pricing", href: "#pricing" },
] as const

export const footerConnectLinks = [
  {
    label: "GitHub",
    href: "https://github.com/Shefilkhan/AI-Opinion-Tracking-",
  },
  { label: "LinkedIn", href: "https://linkedin.com/in/shefilkhan" },
  { label: "Email", href: "mailto:shefilpathan@gmail.com" },
] as const

export const editorialFeatures: {
  title: string
  description: string
  icon: LucideIcon
}[] = [
  {
    title: "13 sources, one search",
    description:
      "Reddit, YouTube, Bluesky, Mastodon, GitHub, Guardian, NewsAPI, Hacker News, Dev.to, and more — queried in parallel.",
    icon: Search,
  },
  {
    title: "AI that reads the room",
    description:
      "Groq-powered summaries explain what people think, why opinions diverge, and which narratives are gaining momentum.",
    icon: Brain,
  },
  {
    title: "Live debate detection",
    description:
      "Surface sharply divided topics with balanced positive and negative sentiment — before they hit mainstream headlines.",
    icon: Scale,
  },
  {
    title: "Trend prediction",
    description:
      "Forecast where public sentiment is heading over the next seven days using momentum across platforms.",
    icon: TrendingUp,
  },
]

export const editorialSteps = [
  {
    step: "01",
    title: "Search any topic",
    description:
      "Enter a keyword, brand, person, or event. OpinionPulse scans 13 live sources at once.",
  },
  {
    step: "02",
    title: "We gather live data",
    description:
      "Real posts, articles, and comments arrive with timestamps, authors, and clickable source links.",
  },
  {
    step: "03",
    title: "AI delivers clarity",
    description:
      "Sentiment scores, debate cards, and trend forecasts turn noise into actionable insight.",
  },
]

/** Key plan comparison rows for the editorial table. */
export const editorialComparisonRows = comparisonRows.filter(
  (row) =>
    row.feature &&
    !row.category &&
    [
      "Monthly searches",
      "Data sources",
      "AI Opinion Summary",
      "AI Debate Analysis",
      "Real-time data",
      "Keyword alerts",
      "CSV export",
      "Team members",
    ].includes(row.feature)
)

export const editorialQuote = {
  text: "OpinionPulse turns scattered conversations into a single, trustworthy pulse — so researchers, journalists, and teams can act on public sentiment with confidence.",
  attribution: "Built for GUNI-SSRIP 2026 · Conestoga College",
}
