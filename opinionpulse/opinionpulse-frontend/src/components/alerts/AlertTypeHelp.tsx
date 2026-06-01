import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cardSurface } from "@/lib/ui-classes"

const HELP_ROWS = [
  {
    type: "Negative Sentiment",
    meaning: "Triggers when negative sentiment % is at or above your threshold (requires analyzed mentions).",
  },
  {
    type: "High Mention Volume",
    meaning: "Triggers when total collected mentions reach your count threshold.",
  },
  {
    type: "Keyword Mention",
    meaning: "Triggers when mentions containing a keyword reach your count threshold.",
  },
  {
    type: "Source Volume",
    meaning: "Triggers when mentions from a specific source (Reddit, YouTube, etc.) reach your threshold.",
  },
]

export function AlertTypeHelp() {
  return (
    <Card className={cardSurface}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-foreground">Alert types</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 text-sm">
          {HELP_ROWS.map((row) => (
            <li key={row.type}>
              <span className="font-medium text-primary">{row.type}</span>
              <p className="mt-0.5 text-muted-foreground">{row.meaning}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          In-app evaluation only — no email or external notifications in this version.
        </p>
      </CardContent>
    </Card>
  )
}
