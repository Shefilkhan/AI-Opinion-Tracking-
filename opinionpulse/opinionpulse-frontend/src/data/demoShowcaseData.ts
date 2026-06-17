export const demoQuery = "Bitcoin"

export const demoSources = [
  { name: "Reddit", live: true },
  { name: "YouTube", live: true },
  { name: "NewsAPI", live: true },
  { name: "Guardian", live: true },
  { name: "HN", live: false },
] as const

export const demoSentiment = {
  mentions: "18.2K",
  positive: 38,
  neutral: 31,
  negative: 31,
} as const

export const demoMentions = [
  {
    id: "1",
    platform: "Reddit",
    platformColor: "bg-orange-500",
    title: "BTC drops 7% overnight — what are holders doing?",
    excerpt: "Thread exploding with 2.4k comments debating ETF flows vs macro fear...",
    sentiment: "negative" as const,
    time: "2h ago",
  },
  {
    id: "2",
    platform: "YouTube",
    platformColor: "bg-red-500",
    title: "Why I'm still bullish on Bitcoin in 2026",
    excerpt: "Creator breaks down on-chain metrics and institutional inflows...",
    sentiment: "positive" as const,
    time: "5h ago",
  },
  {
    id: "3",
    platform: "News",
    platformColor: "bg-blue-500",
    title: "Regulators eye spot crypto ETF approval timeline",
    excerpt: "Major outlets report mixed signals from SEC commentary this week...",
    sentiment: "neutral" as const,
    time: "8h ago",
  },
  {
    id: "4",
    platform: "Guardian",
    platformColor: "bg-sky-600",
    title: "Bitcoin volatility returns as traders brace for CPI data",
    excerpt: "Analysts cite correlation with tech stocks and rate expectations...",
    sentiment: "neutral" as const,
    time: "11h ago",
  },
  {
    id: "5",
    platform: "Dev.to",
    platformColor: "bg-slate-700",
    title: "Building sentiment dashboards for crypto discourse",
    excerpt: "Engineers discuss APIs and NLP pipelines for social listening...",
    sentiment: "positive" as const,
    time: "1d ago",
  },
] as const

export const demoKeywords = [
  { tag: "#bitcoin", weight: 1 },
  { tag: "#crypto", weight: 0.85 },
  { tag: "#etf", weight: 0.72 },
  { tag: "#volatility", weight: 0.65 },
  { tag: "#halving", weight: 0.55 },
  { tag: "#regulation", weight: 0.48 },
] as const

export const demoScrollSteps = [
  { id: "search", label: "Unified search" },
  { id: "sentiment", label: "Sentiment pulse" },
  { id: "ai", label: "AI analysis" },
  { id: "feed", label: "Live mentions" },
] as const
