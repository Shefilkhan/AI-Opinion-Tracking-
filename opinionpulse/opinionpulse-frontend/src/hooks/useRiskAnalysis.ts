import { useCallback, useState } from "react"
import { fetchRiskAnalysis } from "@/api/ai"
import type { RiskProfile } from "@/lib/api/types"

export type RiskAnalysisState = {
  data: RiskProfile | null
  loading: boolean
  error: string | null
}

const initial: RiskAnalysisState = { data: null, loading: false, error: null }

/**
 * Hook to analyse a single content item on demand.
 *
 * Usage:
 *   const { state, analyse, reset } = useRiskAnalysis()
 *   analyse(item.content, hoursPerDay)
 */
export function useRiskAnalysis() {
  const [state, setState] = useState<RiskAnalysisState>(initial)

  const analyse = useCallback(
    async (content: string, socialMediaUsageHours?: number) => {
      if (!content.trim()) return
      setState({ data: null, loading: true, error: null })
      try {
        const result = await fetchRiskAnalysis(content, socialMediaUsageHours)
        setState({ data: result, loading: false, error: null })
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Risk analysis unavailable"
        setState({ data: null, loading: false, error: message })
      }
    },
    []
  )

  const reset = useCallback(() => setState(initial), [])

  return { state, analyse, reset }
}
