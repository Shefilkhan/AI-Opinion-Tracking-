import type { ReportSummarySection } from "@/api/reports"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cardSurface } from "@/lib/ui-classes"

type ReportSummaryCardProps = {
  overview: ReportSummarySection
  projectName?: string
  generatedAt?: string
}

export function ReportSummaryCard({
  overview,
  projectName,
  generatedAt,
}: ReportSummaryCardProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className={cardSurface}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">Project</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold text-white">{projectName ?? "—"}</p>
          {generatedAt && (
            <p className="mt-1 text-xs text-slate-500">
              Generated {new Date(generatedAt).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>
      <Card className={cardSurface}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">Mentions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-white">{overview.total_mentions}</p>
          <p className="text-xs text-slate-500">{overview.total_analyzed} analyzed</p>
        </CardContent>
      </Card>
      <Card className={cardSurface}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">Sentiment mix</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p className="text-emerald-400">
            Positive {overview.positive_percentage.toFixed(0)}%
          </p>
          <p className="text-slate-400">
            Neutral {overview.neutral_percentage.toFixed(0)}%
          </p>
          <p className="text-rose-400">
            Negative {overview.negative_percentage.toFixed(0)}%
          </p>
        </CardContent>
      </Card>
      <Card className={cardSurface}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">Average score</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-violet-300">
            {overview.average_score >= 0 ? "+" : ""}
            {overview.average_score.toFixed(2)}
          </p>
          <p className="text-xs text-slate-500">{overview.keyword_count} keywords tracked</p>
        </CardContent>
      </Card>
    </div>
  )
}
