import { apiRequest } from "@/api/client"
import { getToken } from "@/lib/authStore"

export type BrandWatch = {
  id: string
  name: string
  brand: string
  product?: string | null
  ceo?: string | null
  aliases: string[]
  terms: string[]
  threshold: number
  frequency: string
  enabled: boolean
  watch_type: string
}

export type ResponseBrief = {
  topic: string
  talking_points: string[]
  risks: string[]
  source_count: number
  sample_snippets: string[]
  ai_generated: boolean
}

export type AlertPreferences = {
  email_crisis: boolean
  email_weekly_report: boolean
  slack_crisis: boolean
  slack_webhook_url?: string | null
  slack_configured: boolean
}

export async function listBrandWatches(): Promise<BrandWatch[]> {
  return apiRequest<BrandWatch[]>("/api/brand-watches", { auth: true })
}

export async function createBrandWatch(data: {
  name: string
  brand: string
  product?: string
  ceo?: string
  aliases?: string[]
  threshold?: number
  frequency?: string
}): Promise<BrandWatch> {
  return apiRequest<BrandWatch>("/api/brand-watches", {
    method: "POST",
    auth: true,
    body: data,
  })
}

export async function updateBrandWatch(
  id: string,
  data: Partial<{
    enabled: boolean
    name: string
    brand: string
    product: string
    ceo: string
    aliases: string[]
    threshold: number
    frequency: string
  }>
): Promise<BrandWatch> {
  return apiRequest<BrandWatch>(`/api/brand-watches/${id}`, {
    method: "PATCH",
    auth: true,
    body: data,
  })
}

export async function deleteBrandWatch(id: string): Promise<void> {
  return apiRequest<void>(`/api/brand-watches/${id}`, {
    method: "DELETE",
    auth: true,
  })
}

export async function fetchResponseBrief(watchId: string): Promise<ResponseBrief> {
  return apiRequest<ResponseBrief>(`/api/brand-watches/${watchId}/response-brief`, {
    method: "POST",
    auth: true,
  })
}

export function getWeeklyReportUrl(watchId: string): string {
  const base =
    import.meta.env.VITE_API_BASE_URL ??
    (import.meta.env.DEV ? "" : "http://localhost:8000")
  return `${base}/api/brand-watches/${watchId}/weekly-report`
}

export async function downloadWeeklyReport(watchId: string): Promise<void> {
  const base =
    import.meta.env.VITE_API_BASE_URL ??
    (import.meta.env.DEV ? "" : "http://localhost:8000")
  const token = getToken()
  const response = await fetch(`${base}/api/brand-watches/${watchId}/weekly-report`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  })
  if (!response.ok) {
    throw new Error("Could not download weekly report")
  }
  const html = await response.text()
  const blob = new Blob([html], { type: "text/html" })
  const url = URL.createObjectURL(blob)
  window.open(url, "_blank")
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export async function getAlertPreferences(): Promise<AlertPreferences> {
  return apiRequest<AlertPreferences>("/api/brand-watches/alert-preferences", {
    auth: true,
  })
}

export async function updateAlertPreferences(
  data: Partial<AlertPreferences>
): Promise<AlertPreferences> {
  return apiRequest<AlertPreferences>("/api/brand-watches/alert-preferences", {
    method: "PATCH",
    auth: true,
    body: data,
  })
}
