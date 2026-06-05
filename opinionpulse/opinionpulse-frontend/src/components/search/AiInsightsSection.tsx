import { useAiInsights } from "@/hooks/useAiInsights"
import type { SearchResponse } from "@/lib/api/types"
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
      <p className="rounded-lg border border-purple-100 bg-purple-50/50 px-3 py-2 text-xs text-purple-900">
        💡 Add <code className="text-[11px]">ANTHROPIC_API_KEY</code> to{" "}
        <code className="text-[11px]">opinionpulse-backend/.env.local</code> to
        enable AI features
      </p>
    )
  }

  if (data.results.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      <AiOpinionSummaryCard
        summary={summary.data}
        loading={summary.loading}
        error={summary.error}
        onRetry={retry}
      />
      <AiDebateAnalysisCard
        debate={debate.data}
        loading={debate.loading}
        error={debate.error}
        onRetry={retry}
      />
      <AiTrendPredictionCard
        prediction={predict.data}
        loading={predict.loading}
        error={predict.error}
        onRetry={retry}
      />
    </div>
  )
}
