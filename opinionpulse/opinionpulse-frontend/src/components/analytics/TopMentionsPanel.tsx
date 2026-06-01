import { useQuery } from "@tanstack/react-query"
import { ExternalLink, Loader2 } from "lucide-react"
import { getTopMentions } from "@/api/analytics"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SOURCE_STYLES } from "@/lib/badge-styles"
import { cardSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

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
      <p className="py-6 text-center text-sm text-muted-foreground">
        No {tone} analyzed mentions yet.
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {items.map((m) => (
        <li
          key={m.id}
          className="rounded-lg border border-gray-200 bg-card p-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={cn(
                "capitalize",
                SOURCE_STYLES[m.source] ?? "bg-muted text-foreground/80"
              )}
            >
              {m.source}
            </Badge>
            <span
              className={cn(
                "text-xs font-medium",
                tone === "positive" ? "text-success" : "text-destructive"
              )}
            >
              {m.sentiment_score >= 0 ? "+" : ""}
              {m.sentiment_score.toFixed(2)}
            </span>
            {m.author && (
              <span className="text-xs text-muted-foreground">{m.author}</span>
            )}
          </div>
          <p className="mt-2 line-clamp-3 text-sm text-foreground/80">{m.text}</p>
          {m.url && (
            <a
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:text-primary"
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
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className={cardSurface}>
        <CardHeader>
          <CardTitle className="text-success">Top positive mentions</CardTitle>
        </CardHeader>
        <CardContent>
          <MentionList items={data?.top_positive ?? []} tone="positive" />
        </CardContent>
      </Card>
      <Card className={cardSurface}>
        <CardHeader>
          <CardTitle className="text-destructive">Top negative mentions</CardTitle>
        </CardHeader>
        <CardContent>
          <MentionList items={data?.top_negative ?? []} tone="negative" />
        </CardContent>
      </Card>
    </div>
  )
}
