import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { ApiError } from "@/api/client"
import {
  getProjectSources,
  updateProjectSources,
  type SourceUpdateItem,
} from "@/api/sources"
import { Button } from "@/components/ui/button"
import { btnPrimary, panelSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

const SOURCE_LABELS: Record<string, string> = {
  reddit: "Reddit",
  youtube: "YouTube",
  gdelt: "GDELT News",
}

type SourceSelectorProps = {
  projectId: number
}

export function SourceSelector({ projectId }: SourceSelectorProps) {
  const queryClient = useQueryClient()
  const [localSources, setLocalSources] = useState<SourceUpdateItem[]>([])
  const [error, setError] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["project-sources", projectId],
    queryFn: () => getProjectSources(projectId),
  })

  useEffect(() => {
    if (data?.sources) {
      setLocalSources(
        data.sources.map((s) => ({
          source_name: s.source_name as SourceUpdateItem["source_name"],
          is_enabled: s.is_enabled,
        }))
      )
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: () => updateProjectSources(projectId, localSources),
    onSuccess: () => {
      setError(null)
      queryClient.invalidateQueries({ queryKey: ["project-sources", projectId] })
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.detail : "Failed to save sources")
    },
  })

  function toggleSource(name: SourceUpdateItem["source_name"]) {
    setLocalSources((prev) =>
      prev.map((s) =>
        s.source_name === name ? { ...s, is_enabled: !s.is_enabled } : s
      )
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <Loader2 className="size-4 animate-spin" />
        Loading sources…
      </div>
    )
  }

  return (
    <div className={cn(panelSurface, "p-5")}>
      <h3 className="font-semibold text-white">Data sources</h3>
      <p className="mt-1 text-sm text-slate-400">
        Choose where to collect opinions (API integration coming later).
      </p>
      <div className="mt-4 space-y-3">
        {localSources.map((source) => (
          <label
            key={source.source_name}
            className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/60 px-4 py-3 transition-colors duration-200 hover:border-slate-700/80 hover:bg-slate-950/90"
          >
            <span className="text-sm text-white">
              {SOURCE_LABELS[source.source_name] ?? source.source_name}
            </span>
            <input
              type="checkbox"
              checked={source.is_enabled}
              onChange={() => toggleSource(source.source_name)}
              className="size-4 rounded border-slate-600 accent-blue-600"
            />
          </label>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
      <Button
        className={cn("mt-4", btnPrimary)}
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
      >
        {saveMutation.isPending ? "Saving…" : "Save sources"}
      </Button>
    </div>
  )
}
