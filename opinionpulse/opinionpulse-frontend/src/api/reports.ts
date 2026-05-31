import { apiRequest } from "@/api/client"
import { getToken } from "@/lib/authStore"

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"

export type ReportType = "daily" | "weekly" | "monthly" | "custom"

export type ReportSummarySection = {
  total_mentions: number
  total_analyzed: number
  positive: number
  neutral: number
  negative: number
  positive_percentage: number
  neutral_percentage: number
  negative_percentage: number
  average_score: number
  keyword_count: number
}

export type SourceSentimentReportItem = {
  source: string
  total: number
  positive: number
  neutral: number
  negative: number
  average_score: number
}

export type TopMentionReportItem = {
  id: number
  source: string
  author: string | null
  text: string
  sentiment_label: string
  sentiment_score: number
  confidence: number
  url: string | null
}

export type ReportDetail = {
  id: number
  project_id: number
  project_name: string
  report_type: string
  summary: string
  generated_at: string
  overview: ReportSummarySection
  source_breakdown: SourceSentimentReportItem[]
  top_positive: TopMentionReportItem[]
  top_negative: TopMentionReportItem[]
  keyword_hints: string[]
  themes_positive: string[]
  themes_negative: string[]
}

export type ReportListItem = {
  id: number
  project_id: number
  report_type: string
  summary: string
  generated_at: string
}

export function generateProjectReport(
  projectId: number,
  reportType: ReportType = "custom"
) {
  return apiRequest<ReportDetail>(
    `/api/projects/${projectId}/reports/generate`,
    {
      method: "POST",
      body: { report_type: reportType },
      auth: true,
    }
  )
}

export function getProjectReports(projectId: number) {
  return apiRequest<{ reports: ReportListItem[] }>(
    `/api/projects/${projectId}/reports`,
    { auth: true }
  )
}

export function getReport(reportId: number) {
  return apiRequest<ReportDetail>(`/api/reports/${reportId}`, { auth: true })
}

export function deleteReport(reportId: number) {
  return apiRequest<void>(`/api/reports/${reportId}`, {
    method: "DELETE",
    auth: true,
  })
}

export function getMentionsCsvUrl(projectId: number) {
  return `${API_BASE}/api/projects/${projectId}/reports/export/mentions.csv`
}

export function getSentimentCsvUrl(projectId: number) {
  return `${API_BASE}/api/projects/${projectId}/reports/export/sentiment.csv`
}

export async function downloadProjectCsv(
  projectId: number,
  kind: "mentions" | "sentiment"
) {
  const token = getToken()
  const path =
    kind === "mentions"
      ? `/api/projects/${projectId}/reports/export/mentions.csv`
      : `/api/projects/${projectId}/reports/export/sentiment.csv`

  const response = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (!response.ok) {
    const text = await response.text()
    let detail = "Download failed"
    try {
      const data = JSON.parse(text)
      detail = data.detail ?? detail
    } catch {
      detail = text || detail
    }
    throw new Error(detail)
  }

  const blob = await response.blob()
  const filename =
    kind === "mentions"
      ? `opinionpulse_mentions_project_${projectId}.csv`
      : `opinionpulse_sentiment_project_${projectId}.csv`

  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
