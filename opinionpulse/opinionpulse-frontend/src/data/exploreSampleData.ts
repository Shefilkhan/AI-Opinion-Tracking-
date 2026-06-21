export type SampleDashboardData = {
  sentimentBalance: {
    positivePercent: number
    trendingCount: number
    sourcesLive: number
  }
  searchesToday: number
  weeklyActivity: { day: string; positive: number; negative: number }[]
  sentimentStats: { positive: number; neutral: number; negative: number }
  debates: {
    platform: string
    pColor: string
    title: string
    excerpt: string
    time: string
    sentiment: { pos: number; neu: number; neg: number }
    source: string
  }[]
}

export const SAMPLE_DASHBOARD: SampleDashboardData = {
  sentimentBalance: {
    positivePercent: 58,
    trendingCount: 14,
    sourcesLive: 13,
  },
  searchesToday: 247,
  weeklyActivity: [
    { day: "Sat", positive: 32, negative: 12 },
    { day: "Sun", positive: 28, negative: 9 },
    { day: "Mon", positive: 41, negative: 18 },
    { day: "Tue", positive: 38, negative: 22 },
    { day: "Wed", positive: 52, negative: 24 },
    { day: "Thu", positive: 35, negative: 14 },
    { day: "Fri", positive: 44, negative: 16 },
  ],
  sentimentStats: {
    positive: 58,
    neutral: 24,
    negative: 18,
  },
  debates: [
    {
      platform: "reddit",
      pColor: "#FF4500",
      title: "Remote work policies are reshaping how teams collaborate long-term",
      excerpt:
        "A growing number of companies report productivity gains from flexible work arrangements.",
      time: "12m ago",
      sentiment: { pos: 62, neu: 18, neg: 20 },
      source: "reddit.com/r/business",
    },
    {
      platform: "youtube",
      pColor: "#FF0000",
      title: "AI adoption in enterprise software is accelerating faster than predicted",
      excerpt:
        "Industry analysts highlight rapid integration across customer service and data workflows.",
      time: "38m ago",
      sentiment: { pos: 71, neu: 15, neg: 14 },
      source: "youtube.com/watch",
    },
  ],
}
