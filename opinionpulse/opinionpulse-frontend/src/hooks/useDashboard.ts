import { useQuery } from "@tanstack/react-query"
import { getDashboardOverview } from "@/api/dashboard"

const REFRESH_MS = 5 * 60 * 1000
const STALE_MS = 60 * 1000

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: getDashboardOverview,
    staleTime: STALE_MS,
    refetchInterval: REFRESH_MS,
    placeholderData: (prev) => prev,
  })
}
