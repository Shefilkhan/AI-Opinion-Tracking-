import { Link } from "react-router-dom"
import type { LatestSentiment } from "@/api/dashboard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cardSurface } from "@/lib/ui-classes"

export function LatestSentimentSnapshot({
  snapshot,
}: {
  snapshot: LatestSentiment | null | undefined
}) {
  return (
    <Card className={cardSurface}>
      <CardHeader>
        <CardTitle className="text-foreground">Latest sentiment snapshot</CardTitle>
      </CardHeader>
      <CardContent>
        {!snapshot ? (
          <p className="text-sm text-muted-foreground">
            Run Analyze Sentiment on a project to see a snapshot here.
          </p>
        ) : (
          <>
            <p className="text-sm text-primary">{snapshot.project_name}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center sm:gap-4">
              <div>
                <p className="text-xl font-bold text-success">{snapshot.positive}</p>
                <p className="text-xs text-muted-foreground">Positive</p>
              </div>
              <div>
                <p className="text-xl font-bold text-muted-foreground">{snapshot.neutral}</p>
                <p className="text-xs text-muted-foreground">Neutral</p>
              </div>
              <div>
                <p className="text-xl font-bold text-destructive">{snapshot.negative}</p>
                <p className="text-xs text-muted-foreground">Negative</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Average score: {snapshot.average_score >= 0 ? "+" : ""}
              {snapshot.average_score.toFixed(2)}
            </p>
            <Button
              render={<Link to={`/projects/${snapshot.project_id}`} />}
              variant="outline"
              className="mt-4 h-11 w-full sm:h-8"
            >
              View project
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
