import type { SourceSentimentReportItem } from "@/api/reports"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SOURCE_STYLES } from "@/lib/badge-styles"
import { cardSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type ReportSourceBreakdownProps = {
  items: SourceSentimentReportItem[]
}

export function ReportSourceBreakdown({ items }: ReportSourceBreakdownProps) {
  const active = items.filter((i) => i.total > 0)

  return (
    <Card className={cardSurface}>
      <CardHeader>
        <CardTitle className="text-foreground">Source-wise sentiment</CardTitle>
      </CardHeader>
      <CardContent>
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">No source data available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-muted-foreground">
                  <th className="pb-2 pr-4">Source</th>
                  <th className="pb-2 pr-4">Total</th>
                  <th className="pb-2 pr-4 text-success">+</th>
                  <th className="pb-2 pr-4 text-muted-foreground">~</th>
                  <th className="pb-2 pr-4 text-destructive">−</th>
                  <th className="pb-2">Avg score</th>
                </tr>
              </thead>
              <tbody>
                {active.map((row) => (
                  <tr key={row.source} className="border-b border-gray-200/60">
                    <td className="py-2.5 pr-4">
                      <Badge
                        className={cn(
                          "capitalize",
                          SOURCE_STYLES[row.source] ?? "bg-muted text-foreground/80"
                        )}
                      >
                        {row.source}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-4 text-foreground">{row.total}</td>
                    <td className="py-2.5 pr-4 text-success">{row.positive}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{row.neutral}</td>
                    <td className="py-2.5 pr-4 text-destructive">{row.negative}</td>
                    <td className="py-2.5 text-primary">
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
