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
        <CardTitle className="text-foreground">Alert rules</CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No alerts yet. Create a rule above to monitor opinion signals.
          </p>
        ) : (
          <ul className="space-y-3">
            {alerts.map((a) => (
              <li
                key={a.id}
                className="rounded-lg border border-gray-200 bg-card p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Bell className="size-4 text-primary" />
                    <span className="font-medium text-foreground">
                      {TYPE_LABELS[a.alert_type] ?? a.alert_type}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        a.is_active
                          ? "border-success/20 text-success"
                          : "border-gray-200 text-muted-foreground"
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
                      className="h-8 text-destructive"
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
                <p className="mt-2 text-sm text-muted-foreground">{a.condition_text}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Threshold: {a.threshold_value}
                  {a.alert_type === "negative_sentiment" ? "%" : " mentions"}
                  {a.keyword && ` · Keyword: ${a.keyword}`}
                  {a.source && ` · Source: ${a.source}`}
                </p>
                {a.last_triggered_at && (
                  <p className="mt-1 text-xs text-muted-foreground/90">
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
