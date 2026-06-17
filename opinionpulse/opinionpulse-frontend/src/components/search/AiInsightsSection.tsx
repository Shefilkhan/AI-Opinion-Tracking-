import { useAiInsights } from "@/hooks/useAiInsights"
import type { SearchResponse } from "@/lib/api/types"
import { AIFeatureCard } from "@/components/billing/AIFeatureCard"
import { InlineNotice } from "@/components/layout/InlineNotice"
import { AiDebateAnalysisCard } from "@/components/search/AiDebateAnalysisCard"
import { AiOpinionSummaryCard } from "@/components/search/AiOpinionSummaryCard"
import { AiTrendPredictionCard } from "@/components/search/AiTrendPredictionCard"

type AiInsightsSectionProps = {
  data: SearchResponse
  timeRange: string
}

export function AiInsightsSection({ data, timeRange }: AiInsightsSectionProps) {
  const { aiEnabled, summary, debate, predict, retry } = useAiInsights(
    data,
    timeRange
  )

  if (aiEnabled === null) {
    return null
  }

  if (aiEnabled === false) {
    return (
      <InlineNotice variant="info">
        Add <code className="text-[11px]">ANTHROPIC_API_KEY</code> to{" "}
        <code className="text-[11px]">opinionpulse-backend/.env.local</code> to
        enable AI features
      </InlineNotice>
    )
  }

  if (data.results.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      <AIFeatureCard feature="ai_opinion_summary">
        <AiOpinionSummaryCard
          summary={summary.data}
          loading={summary.loading}
          error={summary.error}
          onRetry={retry}
        />
      </AIFeatureCard>
      <AIFeatureCard feature="ai_debate_analysis">
        <AiDebateAnalysisCard
          debate={debate.data}
          loading={debate.loading}
          error={debate.error}
          onRetry={retry}
        />
      </AIFeatureCard>
      <AIFeatureCard feature="ai_trend_prediction">
        <AiTrendPredictionCard
          prediction={predict.data}
          loading={predict.loading}
          error={predict.error}
          onRetry={retry}
        />
      </AIFeatureCard>
    </div>
  )
}
