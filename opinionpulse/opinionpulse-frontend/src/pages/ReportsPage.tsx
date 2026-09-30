import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Download, Loader2 } from "lucide-react"
import { fetchSearchHistory, searchOpinions } from "@/lib/api/search"
import type { SearchFilters } from "@/lib/api/types"
import {
  buildDetailedSearchCsv,
  buildSearchHistorySummaryCsv,
  detailedSearchFilename,
  downloadCsv,
  historySummaryFilename,
} from "@/lib/csv-export"
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

const DEFAULT_FILTERS: SearchFilters = {
  platform: "all",
  timeRange: "7d",
  sentiment: "all",
  sortBy: "recent",
  language: "all",
}

const RANGE_OPTIONS = [
  { value: "7" as const, label: "Last 7 days" },
  { value: "30" as const, label: "Last 30 days" },
  { value: "all" as const, label: "All time" },
]

export function ReportsPage() {
  const [range, setRange] = useState<"7" | "30" | "all">("30")
  const [exportingId, setExportingId] = useState<string | null>(null)
  const [exportingAll, setExportingAll] = useState(false)
  const [mountedAt] = useState(() => Date.now())
  const { data, isLoading } = useQuery({
    queryKey: ["search-history"],
    queryFn: fetchSearchHistory,
  })

  const items = useMemo(() => {
    const list = data?.items ?? []
    if (range === "all") return list
    const days = range === "7" ? 7 : 30
    const cutoff = mountedAt - days * 86400000
    return list.filter((r) => new Date(r.searched_at).getTime() >= cutoff)
  }, [data, range, mountedAt])

  async function exportDetailedReport(row: (typeof items)[number]) {
    setExportingId(row.id)
    try {
      const searchData = await searchOpinions(row.query, DEFAULT_FILTERS)
      const csv = buildDetailedSearchCsv(searchData, { history: row })
      downloadCsv(csv, detailedSearchFilename(row.query))
    } catch (err) {
      console.error("Detailed export failed:", err)
      window.alert("Could not export detailed report. Try running the search again from the Search page.")
    } finally {
      setExportingId(null)
    }
  }

  function exportAllSummary() {
    setExportingAll(true)
    try {
      const csv = buildSearchHistorySummaryCsv(items)
      downloadCsv(csv, historySummaryFilename())
    } finally {
      setExportingAll(false)
    }
  }

  return (
    <DashboardLayout
      title="Reports"
      subtitle="Your search history and exports"
      headerAction={
        items.length > 0 ? (
          <Button
            type="button"
            className={btnPrimary}
            disabled={exportingAll}
            onClick={exportAllSummary}
          >
            {exportingAll ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Export summary
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
                  <DataTableHeaderCell className="w-36">
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
                        disabled={exportingId === row.id}
                        onClick={() => exportDetailedReport(row)}
                      >
                        {exportingId === row.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Download className="size-3.5" />
                        )}
                        Export CSV
                      </Button>
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          )}

          {items.length > 0 && (
            <p className="mt-4 text-xs text-muted-foreground">
              <strong>Export CSV</strong> downloads a full report with summary stats and every
              mention (platform, author, sentiment, content, URLs).{" "}
              <strong>Export summary</strong> exports your search history table only.
            </p>
          )}
        </PageSection>
      )}
    </DashboardLayout>
  )
}
