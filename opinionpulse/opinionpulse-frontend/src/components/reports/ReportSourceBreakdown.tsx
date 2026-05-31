import type { SourceSentimentReportItem } from "@/api/reports"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cardSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

const SOURCE_STYLES: Record<string, string> = {
  manual: "bg-violet-500/15 text-violet-300",
  reddit: "bg-orange-500/15 text-orange-300",
  youtube: "bg-red-500/15 text-red-300",
  gdelt: "bg-blue-500/15 text-blue-300",
  hackernews: "bg-amber-500/15 text-amber-300",
}

type ReportSourceBreakdownProps = {
  items: SourceSentimentReportItem[]
}

export function ReportSourceBreakdown({ items }: ReportSourceBreakdownProps) {
  const active = items.filter((i) => i.total > 0)

  return (
    <Card className={cardSurface}>
      <CardHeader>
        <CardTitle className="text-white">Source-wise sentiment</CardTitle>
      </CardHeader>
      <CardContent>
        {active.length === 0 ? (
          <p className="text-sm text-slate-500">No source data available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="pb-2 pr-4">Source</th>
                  <th className="pb-2 pr-4">Total</th>
                  <th className="pb-2 pr-4 text-emerald-400">+</th>
                  <th className="pb-2 pr-4 text-slate-400">~</th>
                  <th className="pb-2 pr-4 text-rose-400">−</th>
                  <th className="pb-2">Avg score</th>
                </tr>
              </thead>
              <tbody>
                {active.map((row) => (
                  <tr key={row.source} className="border-b border-slate-800/60">
                    <td className="py-2.5 pr-4">
                      <Badge
                        className={cn(
                          "capitalize",
                          SOURCE_STYLES[row.source] ?? "bg-slate-700 text-slate-300"
                        )}
                      >
                        {row.source}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-4 text-white">{row.total}</td>
                    <td className="py-2.5 pr-4 text-emerald-400">{row.positive}</td>
                    <td className="py-2.5 pr-4 text-slate-400">{row.neutral}</td>
                    <td className="py-2.5 pr-4 text-rose-400">{row.negative}</td>
                    <td className="py-2.5 text-violet-300">
                      {row.average_score >= 0 ? "+" : ""}
                      {row.average_score.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
