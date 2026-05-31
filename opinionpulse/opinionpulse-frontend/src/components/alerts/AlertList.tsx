import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Bell, Trash2 } from "lucide-react"
import type { Alert } from "@/api/alerts"
import { deleteAlert, updateAlert } from "@/api/alerts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cardSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

const TYPE_LABELS: Record<string, string> = {
  negative_sentiment: "Negative sentiment",
  high_volume: "High volume",
  keyword_mention: "Keyword mention",
  source_volume: "Source volume",
}

type AlertListProps = {
  projectId: number
  alerts: Alert[]
}

export function AlertList({ projectId, alerts }: AlertListProps) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-alerts", projectId] })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      updateAlert(id, { is_active: active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-alerts", projectId] })
    },
  })

  return (
    <Card className={cardSurface}>
      <CardHeader>
        <CardTitle className="text-white">Alert rules</CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-slate-500">
            No alerts yet. Create a rule above to monitor opinion signals.
          </p>
        ) : (
          <ul className="space-y-3">
            {alerts.map((a) => (
              <li
                key={a.id}
                className="rounded-lg border border-slate-800/80 bg-slate-950/50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Bell className="size-4 text-violet-400" />
                    <span className="font-medium text-white">
                      {TYPE_LABELS[a.alert_type] ?? a.alert_type}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        a.is_active
                          ? "border-emerald-500/30 text-emerald-300"
                          : "border-slate-600 text-slate-500"
                      )}
                    >
                      {a.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      disabled={toggleMutation.isPending}
                      onClick={() =>
                        toggleMutation.mutate({
                          id: a.id,
                          active: !a.is_active,
                        })
                      }
                    >
                      {a.is_active ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-rose-400"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (confirm("Delete this alert?")) {
                          deleteMutation.mutate(a.id)
                        }
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-400">{a.condition_text}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Threshold: {a.threshold_value}
                  {a.alert_type === "negative_sentiment" ? "%" : " mentions"}
                  {a.keyword && ` · Keyword: ${a.keyword}`}
                  {a.source && ` · Source: ${a.source}`}
                </p>
                {a.last_triggered_at && (
                  <p className="mt-1 text-xs text-amber-400/90">
                    Last triggered {new Date(a.last_triggered_at).toLocaleString()}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
