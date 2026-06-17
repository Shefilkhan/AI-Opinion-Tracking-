import { useCallback, useEffect, useState } from "react"
import { apiRequest } from "@/api/client"
import type { UsageStatus } from "@/api/usage"

export function useUsage() {
  const [data, setData] = useState<UsageStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await apiRequest<UsageStatus>("/api/account/usage", {
        auth: true,
      })
      setData(res)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { usage: data, loading, refresh }
}
