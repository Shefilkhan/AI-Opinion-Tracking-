import type {
  AttentionItem,
  ChangeItem,
  CleanTrendingTopic,
  DashboardIntelligence,
  EmergingConversation,
  GroupedRecentAnalysis,
  LiveDebateItem,
  MonitoredTopicRow,
  PlatformPulse,
  WeeklyActivityPoint,
  YouTubePulseSummary,
} from "@/api/dashboard"

export type DashboardIntelligenceProps = {
  intelligence: DashboardIntelligence
  liveDebates: LiveDebateItem[]
  platformPulse: PlatformPulse[]
  lastUpdated?: string | null
}

export type {
  AttentionItem,
  ChangeItem,
  CleanTrendingTopic,
  DashboardIntelligence,
  EmergingConversation,
  GroupedRecentAnalysis,
  MonitoredTopicRow,
  WeeklyActivityPoint,
  YouTubePulseSummary,
}
