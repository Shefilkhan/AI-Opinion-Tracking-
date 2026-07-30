import type {
  PulseChatCitedSource,
  PulseChatDataUsed,
  PulseChatReference,
  PulseChatStructured,
} from "@/api/chat"

export type ChatMessageItem = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  suggestions?: string[]
  dataUsed?: PulseChatDataUsed
  hasRealData?: boolean
  isError?: boolean
  structured?: PulseChatStructured | null
  responseFormat?: string | null
  references?: PulseChatReference[]
  citedSources?: PulseChatCitedSource[]
  sourcesFetched?: number
}

export type DiscussionTheme = {
  label: string
  percentage: number
  detail?: string
}

export type SentimentSnapshot = {
  topic: string
  positive: number
  neutral: number
  negative: number
  dominantPlatform?: string
  trend?: "rising" | "falling"
}

export type ThemeTableRow = {
  theme: string
  share: number
  detail: string
}
