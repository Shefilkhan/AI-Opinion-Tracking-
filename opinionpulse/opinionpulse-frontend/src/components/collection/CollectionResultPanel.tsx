import type { CollectionSourceResult, CollectAllResponse } from "@/api/collection"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cardSurface } from "@/lib/ui-classes"

type CollectionResultPanelProps = {
  result: CollectionSourceResult | CollectAllResponse | null
  title?: string
}

function isCollectAll(
  result: CollectionSourceResult | CollectAllResponse
): result is CollectAllResponse {
  return "results" in result && "total_inserted" in result
}

function SourceStats({ data }: { data: CollectionSourceResult }) {
  return (
    <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
      <div>
        <dt className="text-muted-foreground">Source</dt>
        <dd className="font-medium capitalize text-foreground">{data.source}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Keywords checked</dt>
        <dd className="font-medium text-foreground">{data.keywords_checked}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Fetched</dt>
        <dd className="font-medium text-foreground">{data.fetched}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Inserted</dt>
        <dd className="font-medium text-success">{data.inserted}</dd>
      </div>
      {data.posts_checked !== undefined && data.posts_checked > 0 && (
        <div>
          <dt className="text-muted-foreground">Posts checked</dt>
          <dd className="font-medium text-foreground">{data.posts_checked}</dd>
        </div>
      )}
      {data.comments_checked !== undefined && data.comments_checked > 0 && (
        <div>
          <dt className="text-muted-foreground">Comments checked</dt>
          <dd className="font-medium text-foreground">{data.comments_checked}</dd>
        </div>
      )}
      {data.videos_checked !== undefined && data.videos_checked > 0 && (
        <div>
          <dt className="text-muted-foreground">Videos checked</dt>
          <dd className="font-medium text-foreground">{data.videos_checked}</dd>
        </div>
      )}
      <div className="col-span-2 sm:col-span-4">
        <dt className="text-muted-foreground">Duplicates skipped</dt>
        <dd className="font-medium text-foreground/80">{data.duplicates_skipped}</dd>
      </div>
      {data.warning && (
        <div className="col-span-2 sm:col-span-4">
          <dt className="text-muted-foreground">Warning</dt>
          <dd className="text-muted-foreground">{data.warning}</dd>
        </div>
      )}
      {data.quota_note && (
        <div className="col-span-2 sm:col-span-4">
          <dt className="text-muted-foreground">Quota note</dt>
          <dd className="text-xs text-muted-foreground">{data.quota_note}</dd>
        </div>
      )}
      {data.rate_limit_note && (
        <div className="col-span-2 sm:col-span-4">
          <dt className="text-muted-foreground">Rate limit note</dt>
          <dd className="text-xs text-muted-foreground">{data.rate_limit_note}</dd>
        </div>
      )}
      {data.message && (
        <div className="col-span-2 sm:col-span-4">
          <dt className="text-muted-foreground">Message</dt>
          <dd className="text-foreground/80">{data.message}</dd>
        </div>
      )}
    </dl>
  )
}

export function CollectionResultPanel({
  result,
  title = "Last collection result",
}: CollectionResultPanelProps) {
  if (!result) return null

  return (
    <Card className={cardSurface}>
      <CardHeader>
        <CardTitle className="text-base text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCollectAll(result) ? (
          <>
            <p className="text-sm text-muted-foreground">{result.message}</p>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <span className="text-muted-foreground">
                Total inserted:{" "}
                <span className="font-medium text-success">
                  {result.total_inserted}
                </span>
              </span>
              <span className="text-muted-foreground">
                Total fetched:{" "}
                <span className="font-medium text-foreground">{result.total_fetched}</span>
              </span>
            </div>
            {typeof result.results.gdelt === "object" && result.results.gdelt !== null && (
              <SourceStats data={result.results.gdelt as CollectionSourceResult} />
            )}
            {typeof result.results.youtube === "object" &&
              result.results.youtube !== null && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">YouTube</p>
                  <SourceStats data={result.results.youtube as CollectionSourceResult} />
                </div>
              )}
            {typeof result.results.reddit === "object" &&
              result.results.reddit !== null && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Reddit</p>
                  <SourceStats data={result.results.reddit as CollectionSourceResult} />
                </div>
              )}
          </>
        ) : (
          <SourceStats data={result} />
        )}
      </CardContent>
    </Card>
  )
}
