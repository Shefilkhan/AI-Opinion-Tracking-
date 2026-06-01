import { Play } from "lucide-react"
import type { AlertEvaluationResponse } from "@/api/alerts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cardSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type AlertEvaluationPanelProps = {
  onEvaluate: () => void
  loading?: boolean
  evaluation: AlertEvaluationResponse | null
}

export function AlertEvaluationPanel({
  onEvaluate,
  loading,
  evaluation,
}: AlertEvaluationPanelProps) {
  return (
    <Card className={cardSurface}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle className="text-foreground">Evaluation results</CardTitle>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={onEvaluate}
          disabled={loading}
        >
          <Play className="size-4" />
          {loading ? "Evaluating…" : "Evaluate alerts"}
        </Button>
      </CardHeader>
      <CardContent>
        {!evaluation ? (
          <p className="text-sm text-muted-foreground">
            Run evaluation to see which rules are triggered against current project data.
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Evaluated {evaluation.evaluated} active rule(s) —{" "}
              <span className="text-muted-foreground">{evaluation.triggered} triggered</span>
            </p>
            {evaluation.results.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active alerts to evaluate.</p>
            ) : (
              <ul className="space-y-2">
                {evaluation.results.map((r) => (
                  <li
                    key={r.alert_id}
                    className="rounded-lg border border-gray-200 bg-background/40 px-3 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        className={cn(
                          r.triggered
                            ? "bg-muted text-muted-foreground border-gray-200"
                            : "bg-card text-foreground/80 border-gray-200"
                        )}
                      >
                        {r.triggered ? "Triggered" : "Not triggered"}
                      </Badge>
                      <span className="text-xs capitalize text-muted-foreground">
                        {r.alert_type.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-foreground/80">{r.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
