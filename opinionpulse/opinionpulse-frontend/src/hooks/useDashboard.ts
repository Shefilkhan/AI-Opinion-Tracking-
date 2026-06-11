import { useQuery } from "@tanstack/react-query"
import { getDashboardOverview } from "@/api/dashboard"

const REFRESH_MS = 5 * 60 * 1000

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: getDashboardOverview,
    refetchInterval: REFRESH_MS,
  })
}
