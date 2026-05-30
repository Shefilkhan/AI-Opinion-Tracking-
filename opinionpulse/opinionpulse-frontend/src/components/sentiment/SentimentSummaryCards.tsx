import { useQuery } from "@tanstack/react-query"
import { Loader2, Minus, ThumbsDown, ThumbsUp } from "lucide-react"
import { getProjectSentimentSummary } from "@/api/sentiment"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cardSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type SentimentSummaryCardsProps = {
  projectId: number
}

const statCards = [
  { key: "total_analyzed" as const, label: "Total Analyzed", icon: null },
  { key: "positive" as const, label: "Positive", icon: ThumbsUp, color: "text-emerald-400" },
  { key: "neutral" as const, label: "Neutral", icon: Minus, color: "text-slate-400" },
  { key: "negative" as const, label: "Negative", icon: ThumbsDown, color: "text-rose-400" },
]

export function SentimentSummaryCards({ projectId }: SentimentSummaryCardsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["sentiment-summary", projectId],
    queryFn: () => getProjectSentimentSummary(projectId),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="size-6 animate-spin text-blue-400" />
      </div>
    )
  }

  if (!data || data.total_analyzed === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 px-4 py-6 text-center text-sm text-slate-500">
        No sentiment analysis yet. Click Analyze Sentiment to begin.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ key, label, icon: Icon, color }) => (
          <Card key={key} className={cardSurface}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-400">
                {Icon && <Icon className={cn("size-4", color)} />}
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{data[key]}</p>
              {key === "positive" && (
                <p className="mt-1 text-xs text-slate-500">
                  {data.positive_percentage}% of analyzed
                </p>
              )}
              {key === "neutral" && (
                <p className="mt-1 text-xs text-slate-500">
                  {data.neutral_percentage}% of analyzed
                </p>
              )}
              {key === "negative" && (
                <p className="mt-1 text-xs text-slate-500">
                  {data.negative_percentage}% of analyzed
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className={cardSurface}>
        <CardContent className="flex flex-wrap items-center justify-between gap-2 pt-6">
          <span className="text-sm text-slate-400">Overall average score (compound)</span>
          <span
            className={cn(
              "text-xl font-bold",
              data.average_score > 0.05
                ? "text-emerald-400"
                : data.average_score < -0.05
                  ? "text-rose-400"
                  : "text-slate-300"
            )}
          >
            {data.average_score >= 0 ? "+" : ""}
            {data.average_score.toFixed(2)}
          </span>
        </CardContent>
      </Card>
    </div>
  )
}
