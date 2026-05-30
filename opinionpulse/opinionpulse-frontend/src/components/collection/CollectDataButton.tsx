import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Download, Layers, Video } from "lucide-react"
import { ApiError } from "@/api/client"
import {
  collectAllSources,
  collectGdelt,
  collectYoutube,
  type CollectionSourceResult,
  type CollectAllResponse,
} from "@/api/collection"
import { Button } from "@/components/ui/button"
import { CollectionResultPanel } from "@/components/collection/CollectionResultPanel"
import { btnPrimary } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type CollectDataButtonProps = {
  projectId: number
}

function invalidateAfterCollection(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: number
) {
  queryClient.invalidateQueries({ queryKey: ["mentions", projectId] })
  queryClient.invalidateQueries({ queryKey: ["mention-stats", projectId] })
  queryClient.invalidateQueries({ queryKey: ["analytics-overview", projectId] })
  queryClient.invalidateQueries({ queryKey: ["analytics-distribution", projectId] })
  queryClient.invalidateQueries({ queryKey: ["analytics-source-sentiment", projectId] })
  queryClient.invalidateQueries({ queryKey: ["analytics-top-mentions", projectId] })
  queryClient.invalidateQueries({ queryKey: ["sentiment-summary", projectId] })
  queryClient.invalidateQueries({ queryKey: ["sentiment-trends", projectId] })
}

export function CollectDataButton({ projectId }: CollectDataButtonProps) {
  const queryClient = useQueryClient()
  const [lastResult, setLastResult] = useState<
    CollectionSourceResult | CollectAllResponse | null
  >(null)
  const [error, setError] = useState<string | null>(null)

  const gdeltMutation = useMutation({
    mutationFn: () => collectGdelt(projectId),
    onSuccess: (data) => {
      setError(null)
      setLastResult(data)
      invalidateAfterCollection(queryClient, projectId)
    },
    onError: (err) => {
      setLastResult(null)
      setError(err instanceof ApiError ? err.detail : "GDELT collection failed.")
    },
  })

  const youtubeMutation = useMutation({
    mutationFn: () => collectYoutube(projectId),
    onSuccess: (data) => {
      setError(null)
      setLastResult(data)
      invalidateAfterCollection(queryClient, projectId)
    },
    onError: (err) => {
      setLastResult(null)
      setError(err instanceof ApiError ? err.detail : "YouTube collection failed.")
    },
  })

  const allMutation = useMutation({
    mutationFn: () => collectAllSources(projectId),
    onSuccess: (data) => {
      setError(null)
      setLastResult(data)
      invalidateAfterCollection(queryClient, projectId)
    },
    onError: (err) => {
      setLastResult(null)
      setError(err instanceof ApiError ? err.detail : "Collection failed.")
    },
  })

  const busy =
    gdeltMutation.isPending ||
    youtubeMutation.isPending ||
    allMutation.isPending

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => gdeltMutation.mutate()}
          disabled={busy}
          className={cn("gap-2", btnPrimary)}
        >
          <Download className="size-4" />
          {gdeltMutation.isPending ? "Collecting GDELT…" : "Collect GDELT News"}
        </Button>
        <Button
          variant="outline"
          onClick={() => youtubeMutation.mutate()}
          disabled={busy}
          className="gap-2"
        >
          <Video className="size-4" />
          {youtubeMutation.isPending
            ? "Collecting YouTube…"
            : "Collect YouTube Comments"}
        </Button>
        <Button
          variant="outline"
          onClick={() => allMutation.mutate()}
          disabled={busy}
          className="gap-2"
        >
          <Layers className="size-4" />
          {allMutation.isPending ? "Collecting…" : "Collect All Enabled Sources"}
        </Button>
      </div>
      <p className="text-xs text-slate-500">
        YouTube search uses API quota — keep keywords limited while testing. After
        collecting new mentions, click Analyze Sentiment to update analytics.
      </p>
      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </p>
      )}
      <CollectionResultPanel result={lastResult} />
    </div>
  )
}
