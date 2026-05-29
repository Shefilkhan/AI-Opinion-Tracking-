import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { deleteMention, getProjectMentions } from "@/api/mentions"
import { MentionCard } from "@/components/mentions/MentionCard"
import type { MentionFilterValues } from "@/components/mentions/MentionFilters"

type MentionFeedProps = {
  projectId: number
  filters: MentionFilterValues
}

export function MentionFeed({ projectId, filters }: MentionFeedProps) {
  const queryClient = useQueryClient()

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["mentions", projectId, filters.source, filters.search],
    queryFn: () =>
      getProjectMentions(projectId, {
        source: filters.source,
        search: filters.search,
        limit: 50,
        offset: 0,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMention,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentions", projectId] })
      queryClient.invalidateQueries({ queryKey: ["mention-stats", projectId] })
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">Mention feed</h3>
        {isFetching && !isLoading && (
          <Loader2 className="size-4 animate-spin text-slate-500" />
        )}
        <span className="text-sm text-slate-500">{data?.total ?? 0} total</span>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="size-6 animate-spin text-blue-400" />
        </div>
      )}

      {!isLoading && data?.mentions.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-700 py-8 text-center text-sm text-slate-500">
          No mentions found. Add sample data or create a manual mention.
        </p>
      )}

      <div className="space-y-3">
        {data?.mentions.map((mention) => (
          <MentionCard
            key={mention.id}
            mention={mention}
            onDelete={(id) => {
              if (confirm("Delete this mention?")) {
                deleteMutation.mutate(id)
              }
            }}
            deleting={deleteMutation.isPending}
          />
        ))}
      </div>
    </div>
  )
}
