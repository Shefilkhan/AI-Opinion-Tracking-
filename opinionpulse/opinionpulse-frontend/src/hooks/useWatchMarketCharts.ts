import { useQuery } from "@tanstack/react-query"
import { getWatchMarketCharts } from "@/api/market"

const REFRESH_MS = 5 * 60 * 1000

export function useWatchMarketCharts(enabled = true) {
  return useQuery({
    queryKey: ["watch-market-charts"],
    queryFn: getWatchMarketCharts,
    enabled,
    staleTime: REFRESH_MS,
    refetchInterval: REFRESH_MS,
  })
}
