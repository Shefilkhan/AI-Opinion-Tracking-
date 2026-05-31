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
        <CardTitle className="text-white">Evaluation results</CardTitle>
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
          <p className="text-sm text-slate-500">
            Run evaluation to see which rules are triggered against current project data.
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              Evaluated {evaluation.evaluated} active rule(s) —{" "}
              <span className="text-amber-300">{evaluation.triggered} triggered</span>
            </p>
            {evaluation.results.length === 0 ? (
              <p className="text-sm text-slate-500">No active alerts to evaluate.</p>
            ) : (
              <ul className="space-y-2">
                {evaluation.results.map((r) => (
                  <li
                    key={r.alert_id}
                    className="rounded-lg border border-slate-800/80 bg-slate-950/40 px-3 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        className={cn(
                          r.triggered
                            ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                            : "bg-slate-700/50 text-slate-300 border-slate-600"
                        )}
                      >
                        {r.triggered ? "Triggered" : "Not triggered"}
                      </Badge>
                      <span className="text-xs capitalize text-slate-500">
                        {r.alert_type.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">{r.message}</p>
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
