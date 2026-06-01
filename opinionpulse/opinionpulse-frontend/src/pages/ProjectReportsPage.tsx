import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, FileBarChart } from "lucide-react"
import {
  generateProjectReport,
  getProjectReports,
  getReport,
  type ReportDetail,
  type ReportType,
} from "@/api/reports"
import { getProject } from "@/api/projects"
import { ApiError } from "@/api/client"
import { ReportActions } from "@/components/reports/ReportActions"
import { ReportHistory } from "@/components/reports/ReportHistory"
import { ReportPreview } from "@/components/reports/ReportPreview"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/ui/LoadingState"

export function ProjectReportsPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const queryClient = useQueryClient()
  const [reportType, setReportType] = useState<ReportType>("custom")
  const [activeReport, setActiveReport] = useState<ReportDetail | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId),
    enabled: !Number.isNaN(projectId),
  })

  const { data: reportsData } = useQuery({
    queryKey: ["project-reports", projectId],
    queryFn: () => getProjectReports(projectId),
    enabled: !Number.isNaN(projectId),
  })

  const generateMutation = useMutation({
    mutationFn: () => generateProjectReport(projectId, reportType),
    onSuccess: (report) => {
      setActiveReport(report)
      setSelectedId(report.id)
      setError(null)
      queryClient.invalidateQueries({ queryKey: ["project-reports", projectId] })
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.detail : "Failed to generate report")
    },
  })

  const viewMutation = useMutation({
    mutationFn: (reportId: number) => getReport(reportId),
    onSuccess: (report) => {
      setActiveReport(report)
      setSelectedId(report.id)
      setError(null)
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.detail : "Failed to load report")
    },
  })

  if (Number.isNaN(projectId)) {
    return (
      <DashboardLayout title="Invalid project">
        <p className="text-muted-foreground">Invalid project ID.</p>
      </DashboardLayout>
    )
  }

  if (projectLoading) {
    return (
      <DashboardLayout title="Loading…">
        <LoadingState label="Loading project…" />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Project Reports"
      subtitle={project?.name ?? "Opinion summary & export"}
    >
      <div className="mb-6 flex flex-wrap items-center gap-3 no-print">
        <Button
          render={<Link to={`/projects/${projectId}`} />}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Back to project
        </Button>
        <span className="flex items-center gap-2 text-sm text-primary">
          <FileBarChart className="size-4" />
          Template-based reports — no external AI APIs
        </span>
      </div>

      <div className="no-print mb-6">
        <ReportActions
          projectId={projectId}
          reportType={reportType}
          onReportTypeChange={setReportType}
          onGenerate={() => generateMutation.mutate()}
          generating={generateMutation.isPending}
        />
      </div>

      {error && (
        <p className="no-print mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          {generateMutation.isPending || viewMutation.isPending ? (
            <LoadingState label="Loading report…" />
          ) : activeReport ? (
            <ReportPreview report={activeReport} />
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 bg-card p-12 text-center no-print">
              <FileBarChart className="mx-auto size-10 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                Generate a report or select one from history to preview.
              </p>
            </div>
          )}
        </div>
        <ReportHistory
          projectId={projectId}
          reports={reportsData?.reports ?? []}
          selectedId={selectedId}
          onView={(id) => viewMutation.mutate(id)}
          onDeleted={() => {
            if (selectedId && activeReport?.id === selectedId) {
              setActiveReport(null)
              setSelectedId(null)
            }
          }}
        />
      </div>
    </DashboardLayout>
  )
}
