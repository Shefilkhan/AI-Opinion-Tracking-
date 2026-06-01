import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Eye, FileText, Trash2 } from "lucide-react"
import type { ReportListItem } from "@/api/reports"
import { deleteReport } from "@/api/reports"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cardSurface } from "@/lib/ui-classes"

type ReportHistoryProps = {
  projectId: number
  reports: ReportListItem[]
  selectedId: number | null
  onView: (id: number) => void
  onDeleted: () => void
}

export function ReportHistory({
  projectId,
  reports,
  selectedId,
  onView,
  onDeleted,
}: ReportHistoryProps) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: (reportId: number) => deleteReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-reports", projectId] })
      onDeleted()
    },
  })

  return (
    <Card className={`${cardSurface} no-print`}>
      <CardHeader>
        <CardTitle className="text-foreground">Report history</CardTitle>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No reports yet. Generate one to see history here.
          </p>
        ) : (
          <ul className="space-y-2">
            {reports.map((r) => (
              <li
                key={r.id}
                className={`rounded-lg border p-3 transition-colors ${
                  selectedId === r.id
                    ? "border-primary/30 bg-muted"
                    : "border-gray-200 bg-background/40"
                }`}
              >
                <div className="flex items-start gap-2">
                  <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium capitalize text-foreground">
                      {r.report_type} report
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.generated_at).toLocaleString()}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.summary}</p>
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1"
                    onClick={() => onView(r.id)}
                  >
                    <Eye className="size-3.5" />
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-destructive"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (confirm("Delete this report?")) {
                        deleteMutation.mutate(r.id)
                      }
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
