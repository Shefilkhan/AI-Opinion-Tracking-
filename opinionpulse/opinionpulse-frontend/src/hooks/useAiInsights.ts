import { useCallback, useEffect, useRef, useState } from "react"
import {
  fetchAiDebate,
  fetchAiPrediction,
  fetchAiSummary,
  getAiStatus,
  type AiDebateAnalysis,
  type AiOpinionSummary,
  type AiTrendPrediction,
} from "@/api/ai"
import { useUsage } from "@/hooks/useUsage"
import type { SearchResponse } from "@/lib/api/types"

type AiLoadState<T> = {
  data: T | null
  loading: boolean
  error: string | null
}

const emptyState = <T,>(): AiLoadState<T> => ({
  data: null,
  loading: false,
  error: null,
})

export function useAiInsights(
  searchData: SearchResponse | null,
  timeRange: string
) {
  const { usage, loading: usageLoading } = useUsage()
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null)
  const [summary, setSummary] = useState<AiLoadState<AiOpinionSummary>>(emptyState)
  const [debate, setDebate] = useState<AiLoadState<AiDebateAnalysis>>(emptyState)
  const [predict, setPredict] = useState<AiLoadState<AiTrendPrediction>>(emptyState)
  const requestId = useRef(0)

  useEffect(() => {
    getAiStatus()
      .then((s) => setAiEnabled(s.enabled))
      .catch(() => setAiEnabled(false))
  }, [])

  const loadInsights = useCallback(async () => {
    if (!searchData || searchData.results.length === 0 || !aiEnabled) return
    // Wait for usage to load before deciding. Treating a null (failed/pending)
    // usage as "allowed" fired gated AI calls that 402'd and popped the upgrade
    // modal mid-search; loadInsights re-runs once usage resolves.
    if (!usage) return
    if (
      !usage.features.ai_opinion_summary &&
      !usage.features.ai_debate_analysis &&
      !usage.features.ai_trend_prediction
    ) {
      return
    }

    const id = ++requestId.current
    setSummary({ data: null, loading: true, error: null })
    setDebate({ data: null, loading: true, error: null })
    setPredict({ data: null, loading: true, error: null })

    const canPredict = searchData.results.length >= 3

    const tasks = []

    if (!usage || usage.features.ai_opinion_summary) {
      tasks.push(
        fetchAiSummary(searchData)
          .then((data) => {
            if (requestId.current === id) {
              setSummary({ data, loading: false, error: null })
            }
          })
          .catch(() => {
            if (requestId.current === id) {
              setSummary({
                data: null,
                loading: false,
                error: "AI analysis unavailable for this search",
              })
            }
          })
      )
    } else {
      setSummary({ data: null, loading: false, error: null })
    }

    if (!usage || usage.features.ai_debate_analysis) {
      tasks.push(
        fetchAiDebate(searchData)
          .then((data) => {
            if (requestId.current === id) {
              setDebate({ data, loading: false, error: null })
            }
          })
          .catch(() => {
            if (requestId.current === id) {
              setDebate({
                data: null,
                loading: false,
                error: "AI analysis unavailable for this search",
              })
            }
          })
      )
    } else {
      setDebate({ data: null, loading: false, error: null })
    }

    if (canPredict && (!usage || usage.features.ai_trend_prediction)) {
      tasks.push(
        fetchAiPrediction(searchData, timeRange)
          .then((data) => {
            if (requestId.current === id) {
              setPredict({ data, loading: false, error: null })
            }
          })
          .catch(() => {
            if (requestId.current === id) {
              setPredict({
                data: null,
                loading: false,
                error: "AI analysis unavailable for this search",
              })
            }
          })
      )
    } else if (!canPredict) {
      setPredict({
        data: null,
        loading: false,
        error: "Not enough data for trend prediction",
      })
    } else {
      setPredict({ data: null, loading: false, error: null })
    }

    await Promise.allSettled(tasks)
  }, [searchData, aiEnabled, timeRange, usage])

  const resultCount = searchData?.results.length ?? 0
  const queryKey = searchData?.query ?? ""

  useEffect(() => {
    if (usageLoading) return
    if (aiEnabled && resultCount > 0 && queryKey) {
      void loadInsights()
    }
  }, [aiEnabled, queryKey, resultCount, timeRange, loadInsights, usageLoading])

  const retry = useCallback(() => {
    void loadInsights()
  }, [loadInsights])

  return {
    aiEnabled,
    summary,
    debate,
    predict,
    retry,
  }
}
