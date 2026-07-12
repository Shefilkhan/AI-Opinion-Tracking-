import { useQuery } from "@tanstack/react-query"
import { getQuiverIntelligence } from "@/api/quiver"

export function useQuiverIntelligence(keyword: string | null) {
  return useQuery({
    queryKey: ["quiver-intelligence", keyword],
    queryFn: () => getQuiverIntelligence(keyword!),
    enabled: Boolean(keyword?.trim()),
    staleTime: 10 * 60 * 1000,
  })
}
