import { useQuery } from "@tanstack/react-query"
import { getMentionStats } from "@/api/mentions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cardInteractive } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

const SOURCE_LABELS: { key: string; label: string; color: string }[] = [
  { key: "total", label: "Total", color: "text-foreground" },
  { key: "manual", label: "Manual", color: "text-muted-foreground" },
  { key: "reddit", label: "Reddit", color: "text-muted-foreground" },
  { key: "youtube", label: "YouTube", color: "text-muted-foreground" },
  { key: "gdelt", label: "GDELT", color: "text-muted-foreground" },
  { key: "hackernews", label: "Hacker News", color: "text-muted-foreground" },
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
    return <p className="text-sm text-muted-foreground">Loading mention stats…</p>
  }

  const total = data?.total_mentions ?? 0
  const bySource = data?.by_source ?? {}

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {SOURCE_LABELS.map((item) => {
        const value =
          item.key === "total" ? total : bySource[item.key] ?? 0
        return (
          <Card key={item.key} className={cn(cardInteractive, "text-center")}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">
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
