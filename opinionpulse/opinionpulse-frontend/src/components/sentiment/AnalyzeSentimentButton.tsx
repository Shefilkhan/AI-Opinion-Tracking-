import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Sparkles } from "lucide-react"
import { ApiError } from "@/api/client"
import { analyzeProjectSentiment } from "@/api/sentiment"
import { Button } from "@/components/ui/button"
import { btnPrimary } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type AnalyzeSentimentButtonProps = {
  projectId: number
}

export function AnalyzeSentimentButton({ projectId }: AnalyzeSentimentButtonProps) {
  const queryClient = useQueryClient()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => analyzeProjectSentiment(projectId),
    onSuccess: (data) => {
      setError(null)
      setMessage(
        `Analyzed ${data.analyzed} mentions (${data.positive} positive, ${data.neutral} neutral, ${data.negative} negative).`
      )
      queryClient.invalidateQueries({ queryKey: ["mentions", projectId] })
      queryClient.invalidateQueries({ queryKey: ["sentiment-summary", projectId] })
      queryClient.invalidateQueries({ queryKey: ["sentiment-trends", projectId] })
      queryClient.invalidateQueries({ queryKey: ["analytics-overview", projectId] })
      queryClient.invalidateQueries({ queryKey: ["analytics-distribution", projectId] })
      queryClient.invalidateQueries({ queryKey: ["analytics-source-sentiment", projectId] })
      queryClient.invalidateQueries({ queryKey: ["analytics-top-mentions", projectId] })
    },
    onError: (err) => {
      setMessage(null)
      setError(
        err instanceof ApiError ? err.detail : "Sentiment analysis failed. Try again."
      )
    },
  })

  return (
    <div className="space-y-2">
      <Button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className={cn("gap-2", btnPrimary)}
      >
        <Sparkles className="size-4" />
        {mutation.isPending ? "Analyzing…" : "Analyze Sentiment"}
      </Button>
      {message && (
        <p className="text-sm text-emerald-300">{message}</p>
      )}
      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </p>
      )}
    </div>
  )
}
