import type { SearchResponse, SearchResultItem } from "@/lib/api/types"
import {
  applySentimentToResults,
  calculateSentimentSummary,
} from "@/lib/api/sentiment"

const TREND_24H = [
  { time: "12AM", positive: 42, negative: 28, neutral: 30, volume: 1200 },
  { time: "2AM", positive: 38, negative: 35, neutral: 27, volume: 980 },
  { time: "4AM", positive: 45, negative: 25, neutral: 30, volume: 1100 },
  { time: "6AM", positive: 52, negative: 22, neutral: 26, volume: 2400 },
  { time: "8AM", positive: 48, negative: 30, neutral: 22, volume: 3100 },
  { time: "10AM", positive: 55, negative: 28, neutral: 17, volume: 4200 },
  { time: "12PM", positive: 60, negative: 20, neutral: 20, volume: 5100 },
  { time: "2PM", positive: 65, negative: 18, neutral: 17, volume: 6800 },
  { time: "4PM", positive: 58, negative: 25, neutral: 17, volume: 5900 },
  { time: "6PM", positive: 50, negative: 32, neutral: 18, volume: 4500 },
  { time: "8PM", positive: 45, negative: 35, neutral: 20, volume: 3800 },
  { time: "10PM", positive: 48, negative: 30, neutral: 22, volume: 2900 },
]

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString()
}

type MockRow = Omit<SearchResultItem, "sentiment" | "sentiment_score">

function row(
  partial: Omit<MockRow, "engagement"> & {
    engagement: { likes: number; shares: number; comments: number }
  }
): MockRow {
  return partial as MockRow
}

const BITCOIN_MOCK: MockRow[] = [
  row({
    id: "1",
    platform: "twitter",
    author: "@crypto_analyst",
    content:
      "Bitcoin just hit a new milestone! The adoption rate is incredible and the future looks very promising. Bullish on BTC!",
    url: "https://twitter.com/example/1",
    posted_at: hoursAgo(1),
    engagement: { likes: 4821, shares: 1203, comments: 342 },
  }),
  row({
    id: "2",
    platform: "reddit",
    author: "u/investing_daily",
    content:
      "Bitcoin crashed again. This is a disaster. Lost everything in this terrible market. The volatility is insane and dangerous for retail investors.",
    url: "https://reddit.com/example/2",
    posted_at: hoursAgo(2),
    engagement: { likes: 892, shares: 234, comments: 567 },
  }),
  row({
    id: "3",
    platform: "news",
    author: "CoinDesk",
    content:
      "Bitcoin price stabilizes as institutional investors show strong support. Analysts predict growth in Q4 with record adoption numbers.",
    url: "https://coindesk.com/example/3",
    posted_at: hoursAgo(3),
    engagement: { likes: 2341, shares: 891, comments: 124 },
  }),
  row({
    id: "4",
    platform: "twitter",
    author: "@blockchain_news",
    content:
      "Warning: Major Bitcoin hack reported. Thousands of wallets compromised. This is a serious threat to the entire ecosystem.",
    url: "https://twitter.com/example/4",
    posted_at: hoursAgo(4),
    engagement: { likes: 12043, shares: 8932, comments: 2341 },
  }),
  row({
    id: "5",
    platform: "youtube",
    author: "CryptoExplained",
    content:
      "Bitcoin is the best investment of the decade. Amazing returns, incredible technology. Love this revolutionary innovation!",
    url: "https://youtube.com/example/5",
    posted_at: hoursAgo(5),
    engagement: { likes: 34210, shares: 4320, comments: 8932 },
  }),
  row({
    id: "6",
    platform: "reddit",
    author: "u/market_watch",
    content:
      "Bitcoin trading volume on major exchanges reached a new record. Price data and blockchain metrics updated hourly.",
    url: "https://reddit.com/example/6",
    posted_at: hoursAgo(6),
    engagement: { likes: 445, shares: 89, comments: 201 },
  }),
  row({
    id: "7",
    platform: "twitter",
    author: "@defi_trader",
    content:
      "Strong surge in Bitcoin ETF inflows. Optimistic outlook as institutions gain exposure. Success story for digital assets.",
    url: "https://twitter.com/example/7",
    posted_at: hoursAgo(7),
    engagement: { likes: 6721, shares: 2100, comments: 890 },
  }),
  row({
    id: "8",
    platform: "news",
    author: "Reuters Crypto",
    content:
      "Regulators issue warning on unregulated crypto exchanges. Concern grows over fraud and illegal schemes targeting Bitcoin holders.",
    url: "https://reuters.com/example/8",
    posted_at: hoursAgo(8),
    engagement: { likes: 1890, shares: 654, comments: 412 },
  }),
  row({
    id: "9",
    platform: "youtube",
    author: "MacroDaily",
    content:
      "The Bitcoin market faces weak demand as bears push price down. Failure to hold support could mean another major drop ahead.",
    url: "https://youtube.com/example/9",
    posted_at: hoursAgo(9),
    engagement: { likes: 5600, shares: 1200, comments: 2300 },
  }),
  row({
    id: "10",
    platform: "twitter",
    author: "@hodl_forever",
    content:
      "Holding Bitcoin long term has been my best decision. Trusted, secure, and brilliant store of value through every cycle.",
    url: "https://twitter.com/example/10",
    posted_at: hoursAgo(10),
    engagement: { likes: 9200, shares: 3100, comments: 780 },
  }),
]

export function getMockResults(query: string): MockRow[] {
  const q = query.toLowerCase()
  if (q.includes("bitcoin") || q.includes("crypto")) return BITCOIN_MOCK
  if (q.includes("ai") || q.includes("artificial intelligence")) {
    return BITCOIN_MOCK.map((r, i) => ({
      ...r,
      id: `ai-${i}`,
      content: r.content.replace(/Bitcoin/gi, "Artificial Intelligence"),
    }))
  }
  if (q.includes("climate")) {
    return BITCOIN_MOCK.map((r, i) => ({
      ...r,
      id: `cl-${i}`,
      content: r.content.replace(/Bitcoin/gi, "Climate Change"),
    }))
  }
  return BITCOIN_MOCK.map((r, i) => ({
    ...r,
    id: `def-${i}`,
    content: r.content.replace(/Bitcoin/gi, query),
  }))
}

export function buildMockSearchResponse(query: string): SearchResponse {
  const raw = applySentimentToResults(
    getMockResults(query) as SearchResultItem[]
  )
  return {
    query,
    total_results: 13533,
    sentiment_summary: calculateSentimentSummary(raw),
    platforms_searched: ["twitter", "reddit", "youtube", "news"],
    demo_mode: true,
    peak_discussion: "Today at 2:00 PM",
    most_active_platform: "twitter",
    results: raw,
    trending_keywords: [
      { word: "innovation", count: 8421 },
      { word: "adoption", count: 7832 },
      { word: "market", count: 6291 },
    ],
    related_topics: ["#Trending", "#News", "#Analysis"],
    sentiment_trend: TREND_24H,
  }
}

/** Client-side fallback if API is unreachable */
export function getClientMockSearch(query: string): SearchResponse {
  return buildMockSearchResponse(query)
}
