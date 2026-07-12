import { apiRequest } from "@/api/client"

export type QuiverRecord = {
  title: string
  subtitle: string | null
  date: string | null
  detail: string | null
  amount: string | null
  meta: Record<string, string>
}

export type QuiverSection = {
  id: string
  label: string
  emoji: string
  description: string
  available: boolean
  message: string | null
  records: QuiverRecord[]
}

export type QuiverIntelligenceResponse = {
  query: string
  ticker: string | null
  configured: boolean
  asset_type: "stock" | "crypto" | "unknown"
  sections: QuiverSection[]
  source: string
  message: string | null
}

export async function getQuiverIntelligence(query: string): Promise<QuiverIntelligenceResponse> {
  const params = new URLSearchParams({ q: query })
  return apiRequest<QuiverIntelligenceResponse>(`/api/market/quiver?${params.toString()}`, {
    auth: true,
  })
}
