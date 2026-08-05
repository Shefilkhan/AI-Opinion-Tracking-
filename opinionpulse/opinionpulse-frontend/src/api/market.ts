import { apiRequest } from "@/api/client"

export type MarketChartPoint = {
  time: string
  price: number
}

export type MarketChartResponse = {
  query: string
  asset_type: "crypto" | "stock" | "unknown"
  symbol: string | null
  name: string
  current_price: number | null
  change_pct: number | null
  currency: string
  points: MarketChartPoint[]
  message: string | null
  proxy_note?: string | null
}

export type WatchMarketChart = MarketChartResponse & {
  watch_id: string
}

export type WatchMarketChartsResponse = {
  charts: WatchMarketChart[]
}

export async function getMarketChart(query: string): Promise<MarketChartResponse> {
  const params = new URLSearchParams({ q: query })
  return apiRequest<MarketChartResponse>(`/api/market/chart?${params.toString()}`, {
    auth: true,
  })
}

export async function getWatchMarketCharts(): Promise<WatchMarketChartsResponse> {
  return apiRequest<WatchMarketChartsResponse>("/api/market/charts/watches", {
    auth: true,
  })
}
