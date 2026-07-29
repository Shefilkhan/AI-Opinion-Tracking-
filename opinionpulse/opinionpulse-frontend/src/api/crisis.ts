import { apiRequest } from "@/api/client"

export type CrisisQuadrant = "quiet" | "noise" | "watch" | "crisis"

export type RadarPoint = {
  watch_id: string
  keyword: string
  name?: string | null
  enabled: boolean
  volume_score: number
  velocity_score: number
  quadrant: CrisisQuadrant
  status_label: string
  status_explanation: string
  mention_count_30m: number
  negative_count_30m: number
  negative_pct_30m: number
  baseline_negative_30m: number
  baseline_mentions_30m?: number
  negative_spike_multiplier?: number
  volume_spike_multiplier?: number
  spike_label?: string
  spike_severity?: string
  last_scanned_at: string | null
  in_crisis: boolean
}

export type CrisisNarrative = {
  id: string
  label: string
  summary: string
  severity: "low" | "medium" | "high" | "critical"
  negative_pct: number
  mention_count: number
  primary_platform: string
  example_snippet: string
  example_url?: string | null
}

export type TimelineNode = {
  id: string
  platform: string
  title: string
  snippet: string
  source_url?: string | null
  posted_at?: string | null
  minutes_after_origin?: number | null
  role: "origin" | "spread" | "amplification"
}

export type CrisisEvent = {
  id: string
  query: string
  quadrant: CrisisQuadrant
  volume_score: number
  velocity_score: number
  status_label: string
  summary?: string | null
  alert_sent: boolean
  created_at: string
}

export type CrisisRadarResponse = {
  points: RadarPoint[]
  legend: Record<string, string>
  last_updated: string
  scan_interval_minutes: number
}

export type CrisisDetailResponse = {
  watch_id: string
  keyword: string
  quadrant: CrisisQuadrant
  volume_score: number
  velocity_score: number
  status_label: string
  status_explanation: string
  mention_count_30m: number
  negative_count_30m: number
  negative_pct_30m: number
  narratives: CrisisNarrative[]
  timeline: TimelineNode[]
  recent_events: CrisisEvent[]
  last_scanned_at?: string | null
}

export async function getCrisisRadar(): Promise<CrisisRadarResponse> {
  return apiRequest<CrisisRadarResponse>("/api/crisis/radar", { auth: true })
}

export async function getCrisisDetail(watchId: string): Promise<CrisisDetailResponse> {
  return apiRequest<CrisisDetailResponse>(`/api/crisis/detail/${watchId}`, { auth: true })
}

export async function scanCrisisWatch(watchId: string): Promise<{
  watch_id: string
  keyword: string
  scanned: boolean
  quadrant: CrisisQuadrant
  message: string
  detail?: CrisisDetailResponse
}> {
  return apiRequest(`/api/crisis/scan/${watchId}`, { method: "POST", auth: true })
}

export async function listCrisisEvents(): Promise<CrisisEvent[]> {
  return apiRequest<CrisisEvent[]>("/api/crisis/events", { auth: true })
}
