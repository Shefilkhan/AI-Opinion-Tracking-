import { useQuery } from "@tanstack/react-query"
import { getDashboardOverview, getLiveDebates } from "@/api/dashboard"

const REFRESH_MS = 5 * 60 * 1000
const STALE_MS = 60 * 1000
const OVERVIEW_TIMEOUT_MS = 25_000

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: () =>
      getDashboardOverview({ timeoutMs: OVERVIEW_TIMEOUT_MS }),
    staleTime: STALE_MS,
    refetchInterval: REFRESH_MS,
    retry: 1,
    placeholderData: (prev) => prev,
  })
}

export function useLiveDebates(enabled = true) {
  return useQuery({
    queryKey: ["dashboard-live-debates"],
    queryFn: () => getLiveDebates({ timeoutMs: 45_000 }),
    enabled,
    staleTime: STALE_MS,
    refetchInterval: REFRESH_MS,
    retry: 1,
  })
}
