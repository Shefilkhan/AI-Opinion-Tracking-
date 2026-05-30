import { useQuery } from "@tanstack/react-query"
import { ExternalLink, Loader2 } from "lucide-react"
import { getTopMentions } from "@/api/analytics"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cardSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

const SOURCE_STYLES: Record<string, string> = {
  manual: "bg-violet-500/15 text-violet-300",
  reddit: "bg-orange-500/15 text-orange-300",
  youtube: "bg-red-500/15 text-red-300",
  gdelt: "bg-blue-500/15 text-blue-300",
  hackernews: "bg-amber-500/15 text-amber-300",
}

type TopMentionsPanelProps = {
  projectId: number
  limit?: number
}

function MentionList({
  items,
  tone,
}: {
  items: Awaited<ReturnType<typeof getTopMentions>>["top_positive"]
  tone: "positive" | "negative"
}) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">
        No {tone} analyzed mentions yet.
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {items.map((m) => (
        <li
          key={m.id}
          className="rounded-lg border border-slate-800/80 bg-slate-950/50 p-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={cn(
                "capitalize",
                SOURCE_STYLES[m.source] ?? "bg-slate-700 text-slate-300"
              )}
            >
              {m.source}
            </Badge>
            <span
              className={cn(
                "text-xs font-medium",
                tone === "positive" ? "text-emerald-400" : "text-rose-400"
              )}
            >
              {m.sentiment_score >= 0 ? "+" : ""}
              {m.sentiment_score.toFixed(2)}
            </span>
            {m.author && (
              <span className="text-xs text-slate-500">{m.author}</span>
            )}
          </div>
          <p className="mt-2 line-clamp-3 text-sm text-slate-300">{m.text}</p>
          {m.url && (
            <a
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
            >
              Open URL
              <ExternalLink className="size-3" />
            </a>
          )}
        </li>
      ))}
    </ul>
  )
}

export function TopMentionsPanel({ projectId, limit = 5 }: TopMentionsPanelProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics-top-mentions", projectId, limit],
    queryFn: () => getTopMentions(projectId, limit),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="size-6 animate-spin text-blue-400" />
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className={cardSurface}>
        <CardHeader>
          <CardTitle className="text-emerald-400">Top positive mentions</CardTitle>
        </CardHeader>
        <CardContent>
          <MentionList items={data?.top_positive ?? []} tone="positive" />
        </CardContent>
      </Card>
      <Card className={cardSurface}>
        <CardHeader>
          <CardTitle className="text-rose-400">Top negative mentions</CardTitle>
        </CardHeader>
        <CardContent>
          <MentionList items={data?.top_negative ?? []} tone="negative" />
        </CardContent>
      </Card>
    </div>
  )
}
