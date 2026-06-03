import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Download } from "lucide-react"
import { fetchSearchHistory } from "@/lib/api/search"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/ui/LoadingState"

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
    <DashboardLayout title="Reports" subtitle="Your search history and exports">
      {isLoading ? (
        <LoadingState label="Loading reports…" />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {(["7", "30", "all"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={
                  range === r
                    ? "rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                    : "rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-muted-foreground"
                }
              >
                {r === "all" ? "All time" : `Last ${r} days`}
              </button>
            ))}
          </div>

          {items.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
              <p className="font-medium text-foreground">No searches yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Run a search to see reports here.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-medium">Query</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Results</th>
                    <th className="px-4 py-3 font-medium">Sentiment</th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3 font-medium">{row.query}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(row.searched_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">{row.results_count.toLocaleString()}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.sentiment_positive != null
                          ? `${row.sentiment_positive}% pos`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}
