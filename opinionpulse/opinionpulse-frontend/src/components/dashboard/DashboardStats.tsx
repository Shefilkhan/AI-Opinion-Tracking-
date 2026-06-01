import type { DashboardSummary } from "@/api/dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cardSurface } from "@/lib/ui-classes"

const ITEMS = [
  { key: "total_projects", label: "Projects", color: "text-foreground" },
  { key: "total_mentions", label: "Mentions", color: "text-primary" },
  { key: "total_analyzed", label: "Analyzed", color: "text-primary" },
  { key: "total_reports", label: "Reports", color: "text-success" },
] as const

export function DashboardStats({ summary }: { summary?: DashboardSummary }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {ITEMS.map(({ key, label, color }) => (
        <Card key={key} className={cardSurface}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-semibold sm:text-3xl ${color}`}>
              {summary ? summary[key] : 0}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
