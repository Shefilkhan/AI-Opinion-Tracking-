import { useQuery } from "@tanstack/react-query"
import { getMarketChart } from "@/api/market"

export function useMarketChart(keyword: string | null) {
  return useQuery({
    queryKey: ["market-chart", keyword],
    queryFn: () => getMarketChart(keyword!),
    enabled: Boolean(keyword?.trim()),
    staleTime: 5 * 60 * 1000,
  })
}
