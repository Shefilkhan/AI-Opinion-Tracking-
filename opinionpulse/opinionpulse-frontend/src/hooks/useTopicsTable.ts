import { useCallback, useEffect, useState } from "react"
import { getTopicsTable } from "@/api/dashboard"
import type { SortField, SortOrder, Timeframe, TopicRow } from "@/types/dashboard"

export function useTopicsTable() {
  const [topics, setTopics] = useState<TopicRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortField>("engagement")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [timeframe, setTimeframe] = useState<Timeframe>("7d")

  const fetchTopics = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getTopicsTable({ sortBy, sortOrder, timeframe })
      setTopics(data.topics)
    } catch {
      setTopics([])
    } finally {
      setLoading(false)
    }
  }, [sortBy, sortOrder, timeframe])

  useEffect(() => {
    void fetchTopics()
  }, [fetchTopics])

  function toggleSort(field: SortField) {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
  }

  return {
    topics,
    loading,
    sortBy,
    sortOrder,
    timeframe,
    setTimeframe,
    toggleSort,
    refresh: fetchTopics,
  }
}
