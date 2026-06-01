import { CheckCircle2, Circle } from "lucide-react"
import type { DashboardSummary } from "@/api/dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cardSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type GettingStartedChecklistProps = {
  summary?: DashboardSummary
}

export function GettingStartedChecklist({ summary }: GettingStartedChecklistProps) {
  const hasProject = (summary?.total_projects ?? 0) > 0
  const hasMentions = (summary?.total_mentions ?? 0) > 0
  const hasAnalyzed = (summary?.total_analyzed ?? 0) > 0
  const hasReports = (summary?.total_reports ?? 0) > 0

  const steps = [
    { label: "Create your first project", done: hasProject },
    { label: "Add keywords", done: hasProject },
    { label: "Enable data sources", done: hasProject },
    { label: "Collect data", done: hasMentions },
    { label: "Analyze sentiment", done: hasAnalyzed },
    { label: "Ask AI Opinion Assistant", done: hasAnalyzed },
    { label: "Generate report", done: hasReports },
    { label: "Create alerts", done: hasProject },
  ]

  return (
    <Card className={cardSurface}>
      <CardHeader>
        <CardTitle className="text-foreground">Getting started</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {steps.map((step) => (
            <li key={step.label} className="flex items-center gap-2 text-sm">
              {step.done ? (
                <CheckCircle2 className="size-4 shrink-0 text-success" />
              ) : (
                <Circle className="size-4 shrink-0 text-muted-foreground" />
              )}
              <span className={cn(step.done ? "text-muted-foreground" : "text-foreground/80")}>
                {step.label}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
