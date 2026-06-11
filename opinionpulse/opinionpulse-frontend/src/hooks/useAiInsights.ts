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

    const id = ++requestId.current
    setSummary({ data: null, loading: true, error: null })
    setDebate({ data: null, loading: true, error: null })
    setPredict({ data: null, loading: true, error: null })

    const canPredict = searchData.results.length >= 3

    const tasks = [
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
        }),
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
        }),
    ]

    if (canPredict) {
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
    } else {
      setPredict({
        data: null,
        loading: false,
        error: "Not enough data for trend prediction",
      })
    }

    await Promise.allSettled(tasks)
  }, [searchData, aiEnabled, timeRange])

  const resultCount = searchData?.results.length ?? 0
  const queryKey = searchData?.query ?? ""

  useEffect(() => {
    if (aiEnabled && resultCount > 0 && queryKey) {
      void loadInsights()
    }
  }, [aiEnabled, queryKey, resultCount, timeRange, loadInsights])

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
