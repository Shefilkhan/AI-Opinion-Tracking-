import { ExternalLink } from "lucide-react"
import type { TopMentionReportItem } from "@/api/reports"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

function MentionList({
  title,
  items,
  tone,
}: {
  title: string
  items: TopMentionReportItem[]
  tone: "positive" | "negative"
}) {
  return (
    <Card className={cardSurface}>
      <CardHeader>
        <CardTitle
          className={cn(
            "text-base",
            tone === "positive" ? "text-emerald-300" : "text-rose-300"
          )}
        >
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">No {tone} mentions in this report.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((m) => (
              <li
                key={m.id}
                className="rounded-lg border border-slate-800/80 bg-slate-950/50 p-3"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
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
                </div>
                <p className="line-clamp-4 text-sm text-slate-300">{m.text}</p>
                {m.url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-8 gap-1 px-2 text-blue-400"
                    render={
                      <a href={m.url} target="_blank" rel="noopener noreferrer" />
                    }
                  >
                    <ExternalLink className="size-3.5" />
                    Open
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

type ReportTopMentionsProps = {
  topPositive: TopMentionReportItem[]
  topNegative: TopMentionReportItem[]
}

export function ReportTopMentions({
  topPositive,
  topNegative,
}: ReportTopMentionsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <MentionList title="Top positive mentions" items={topPositive} tone="positive" />
      <MentionList title="Top negative mentions" items={topNegative} tone="negative" />
    </div>
  )
}
