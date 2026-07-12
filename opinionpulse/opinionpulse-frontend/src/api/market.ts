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
}

export async function getMarketChart(query: string): Promise<MarketChartResponse> {
  const params = new URLSearchParams({ q: query })
  return apiRequest<MarketChartResponse>(`/api/market/chart?${params.toString()}`, {
    auth: true,
  })
}
