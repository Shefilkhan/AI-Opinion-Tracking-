import { useQuery } from "@tanstack/react-query"
import { getCrisisDetail, getCrisisRadar } from "@/api/crisis"

const REFRESH_MS = 2 * 60 * 1000

export function useCrisisRadar() {
  return useQuery({
    queryKey: ["crisis-radar"],
    queryFn: getCrisisRadar,
    refetchInterval: REFRESH_MS,
  })
}

export function useCrisisDetail(watchId: string | null) {
  return useQuery({
    queryKey: ["crisis-detail", watchId],
    queryFn: () => getCrisisDetail(watchId!),
    enabled: Boolean(watchId),
  })
}
