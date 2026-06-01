import { ExternalLink } from "lucide-react"
import type { TopMentionReportItem } from "@/api/reports"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SOURCE_STYLES } from "@/lib/badge-styles"
import { cardSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

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
            tone === "positive" ? "text-success" : "text-destructive"
          )}
        >
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No {tone} mentions in this report.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((m) => (
              <li
                key={m.id}
                className="rounded-lg border border-gray-200 bg-card p-3"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
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
                </div>
                <p className="line-clamp-4 text-sm text-foreground/80">{m.text}</p>
                {m.url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-8 gap-1 px-2 text-primary"
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
