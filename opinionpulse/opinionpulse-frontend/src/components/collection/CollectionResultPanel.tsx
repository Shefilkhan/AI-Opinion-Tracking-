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
        <dt className="text-slate-500">Source</dt>
        <dd className="font-medium capitalize text-white">{data.source}</dd>
      </div>
      <div>
        <dt className="text-slate-500">Keywords checked</dt>
        <dd className="font-medium text-white">{data.keywords_checked}</dd>
      </div>
      <div>
        <dt className="text-slate-500">Fetched</dt>
        <dd className="font-medium text-white">{data.fetched}</dd>
      </div>
      <div>
        <dt className="text-slate-500">Inserted</dt>
        <dd className="font-medium text-emerald-400">{data.inserted}</dd>
      </div>
      {data.videos_checked !== undefined && data.videos_checked > 0 && (
        <div>
          <dt className="text-slate-500">Videos checked</dt>
          <dd className="font-medium text-white">{data.videos_checked}</dd>
        </div>
      )}
      <div className="col-span-2 sm:col-span-4">
        <dt className="text-slate-500">Duplicates skipped</dt>
        <dd className="font-medium text-slate-300">{data.duplicates_skipped}</dd>
      </div>
      {data.warning && (
        <div className="col-span-2 sm:col-span-4">
          <dt className="text-slate-500">Warning</dt>
          <dd className="text-amber-300">{data.warning}</dd>
        </div>
      )}
      {data.quota_note && (
        <div className="col-span-2 sm:col-span-4">
          <dt className="text-slate-500">Quota note</dt>
          <dd className="text-xs text-slate-400">{data.quota_note}</dd>
        </div>
      )}
      {data.message && (
        <div className="col-span-2 sm:col-span-4">
          <dt className="text-slate-500">Message</dt>
          <dd className="text-slate-300">{data.message}</dd>
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
        <CardTitle className="text-base text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCollectAll(result) ? (
          <>
            <p className="text-sm text-slate-400">{result.message}</p>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <span className="text-slate-500">
                Total inserted:{" "}
                <span className="font-medium text-emerald-400">
                  {result.total_inserted}
                </span>
              </span>
              <span className="text-slate-500">
                Total fetched:{" "}
                <span className="font-medium text-white">{result.total_fetched}</span>
              </span>
            </div>
            {typeof result.results.gdelt === "object" && result.results.gdelt !== null && (
              <SourceStats data={result.results.gdelt as CollectionSourceResult} />
            )}
            {typeof result.results.youtube === "object" &&
              result.results.youtube !== null && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-white">YouTube</p>
                  <SourceStats data={result.results.youtube as CollectionSourceResult} />
                </div>
              )}
            {typeof result.results.reddit === "object" &&
              result.results.reddit !== null && (
                <p className="text-xs text-amber-300/90">
                  Reddit:{" "}
                  {(result.results.reddit as CollectionSourceResult).message ??
                    "not implemented yet"}
                </p>
              )}
          </>
        ) : (
          <SourceStats data={result} />
        )}
      </CardContent>
    </Card>
  )
}
