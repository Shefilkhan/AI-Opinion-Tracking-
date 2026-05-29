import { useQuery } from "@tanstack/react-query"
import { getMentionStats } from "@/api/mentions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const SOURCE_LABELS: { key: string; label: string; color: string }[] = [
  { key: "total", label: "Total", color: "text-white" },
  { key: "manual", label: "Manual", color: "text-violet-400" },
  { key: "reddit", label: "Reddit", color: "text-orange-400" },
  { key: "youtube", label: "YouTube", color: "text-red-400" },
  { key: "gdelt", label: "GDELT", color: "text-blue-400" },
  { key: "hackernews", label: "Hacker News", color: "text-amber-400" },
]

type MentionStatsProps = {
  projectId: number
}

export function MentionStats({ projectId }: MentionStatsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["mention-stats", projectId],
    queryFn: () => getMentionStats(projectId),
  })

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading mention stats…</p>
  }

  const total = data?.total_mentions ?? 0
  const bySource = data?.by_source ?? {}

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {SOURCE_LABELS.map((item) => {
        const value =
          item.key === "total" ? total : bySource[item.key] ?? 0
        return (
          <Card key={item.key} className="border-slate-800/60 bg-slate-900/50">
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-slate-500">
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${item.color}`}>{value}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
