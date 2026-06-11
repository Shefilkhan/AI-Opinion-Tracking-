import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Download } from "lucide-react"
import { fetchSearchHistory } from "@/lib/api/search"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from "@/components/layout/DataTable"
import { EmptyState } from "@/components/layout/EmptyState"
import { PageSection } from "@/components/layout/PageSection"
import { SegmentedControl } from "@/components/layout/SegmentedControl"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/ui/LoadingState"
import { btnPrimary } from "@/lib/ui-classes"

function exportCsv(
  rows: {
    query: string
    searched_at: string
    results_count: number
    sentiment_positive?: number | null
    sentiment_negative?: number | null
    sentiment_neutral?: number | null
  }[]
) {
  const header = "query,date,results_count,positive_pct,negative_pct,neutral_pct\n"
  const body = rows
    .map((r) => {
      const d = new Date(r.searched_at).toISOString()
      return `"${r.query.replace(/"/g, '""')}",${d},${r.results_count},${r.sentiment_positive ?? ""},${r.sentiment_negative ?? ""},${r.sentiment_neutral ?? ""}`
    })
    .join("\n")
  const blob = new Blob([header + body], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `opinionpulse-reports-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const RANGE_OPTIONS = [
  { value: "7" as const, label: "Last 7 days" },
  { value: "30" as const, label: "Last 30 days" },
  { value: "all" as const, label: "All time" },
]

export function ReportsPage() {
  const [range, setRange] = useState<"7" | "30" | "all">("30")
  const { data, isLoading } = useQuery({
    queryKey: ["search-history"],
    queryFn: fetchSearchHistory,
  })

  const items = useMemo(() => {
    const list = data?.items ?? []
    if (range === "all") return list
    const days = range === "7" ? 7 : 30
    const cutoff = Date.now() - days * 86400000
    return list.filter((r) => new Date(r.searched_at).getTime() >= cutoff)
  }, [data, range])

  return (
    <DashboardLayout
      title="Reports"
      subtitle="Your search history and exports"
      headerAction={
        items.length > 0 ? (
          <Button
            type="button"
            className={btnPrimary}
            onClick={() => exportCsv(items)}
          >
            <Download className="size-4" />
            Export all
          </Button>
        ) : undefined
      }
    >
      {isLoading ? (
        <LoadingState label="Loading reports…" />
      ) : (
        <PageSection>
          <div className="mb-5">
            <SegmentedControl
              options={RANGE_OPTIONS}
              value={range}
              onChange={setRange}
              aria-label="Date range"
            />
          </div>

          {items.length === 0 ? (
            <EmptyState
              title="No searches yet"
              description="Run a search to see reports here."
            />
          ) : (
            <DataTable>
              <DataTableHead>
                <DataTableRow>
                  <DataTableHeaderCell>Query</DataTableHeaderCell>
                  <DataTableHeaderCell>Date</DataTableHeaderCell>
                  <DataTableHeaderCell>Results</DataTableHeaderCell>
                  <DataTableHeaderCell>Positive</DataTableHeaderCell>
                  <DataTableHeaderCell>Negative</DataTableHeaderCell>
                  <DataTableHeaderCell>Neutral</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-28">
                    <span className="sr-only">Actions</span>
                  </DataTableHeaderCell>
                </DataTableRow>
              </DataTableHead>
              <DataTableBody>
                {items.map((row) => (
                  <DataTableRow key={row.id}>
                    <DataTableCell className="font-medium">{row.query}</DataTableCell>
                    <DataTableCell className="text-muted-foreground">
                      {new Date(row.searched_at).toLocaleString()}
                    </DataTableCell>
                    <DataTableCell>{row.results_count.toLocaleString()}</DataTableCell>
                    <DataTableCell>
                      {row.sentiment_positive != null ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          {row.sentiment_positive}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </DataTableCell>
                    <DataTableCell>
                      {row.sentiment_negative != null ? (
                        <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
                          {row.sentiment_negative}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </DataTableCell>
                    <DataTableCell>
                      {row.sentiment_neutral != null ? (
                        <span className="inline-flex items-center rounded-full bg-gray-500/10 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                          {row.sentiment_neutral}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </DataTableCell>
                    <DataTableCell>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => exportCsv([row])}
                      >
                        <Download className="size-3.5" />
                        Export
                      </Button>
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          )}
        </PageSection>
      )}
    </DashboardLayout>
  )
}
