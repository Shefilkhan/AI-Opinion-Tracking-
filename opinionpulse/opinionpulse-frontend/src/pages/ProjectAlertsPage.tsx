import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Bell } from "lucide-react"
import {
  createAlert,
  evaluateProjectAlerts,
  getProjectAlerts,
  type AlertCreate,
  type AlertEvaluationResponse,
} from "@/api/alerts"
import { getProject } from "@/api/projects"
import { ApiError } from "@/api/client"
import { AlertEvaluationPanel } from "@/components/alerts/AlertEvaluationPanel"
import { AlertForm } from "@/components/alerts/AlertForm"
import { AlertList } from "@/components/alerts/AlertList"
import { AlertTypeHelp } from "@/components/alerts/AlertTypeHelp"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/ui/LoadingState"

export function ProjectAlertsPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const queryClient = useQueryClient()
  const [evaluation, setEvaluation] = useState<AlertEvaluationResponse | null>(
    null
  )
  const [formError, setFormError] = useState<string | null>(null)

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId),
    enabled: !Number.isNaN(projectId),
  })

  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ["project-alerts", projectId],
    queryFn: () => getProjectAlerts(projectId),
    enabled: !Number.isNaN(projectId),
  })

  const createMutation = useMutation({
    mutationFn: (data: AlertCreate) => createAlert(projectId, data),
    onSuccess: () => {
      setFormError(null)
      setEvaluation(null)
      queryClient.invalidateQueries({ queryKey: ["project-alerts", projectId] })
    },
    onError: (err) => {
      setFormError(err instanceof ApiError ? err.detail : "Failed to create alert")
    },
  })

  const evaluateMutation = useMutation({
    mutationFn: () => evaluateProjectAlerts(projectId),
    onSuccess: (res) => {
      setEvaluation(res)
      queryClient.invalidateQueries({ queryKey: ["project-alerts", projectId] })
    },
    onError: (err) => {
      setFormError(
        err instanceof ApiError ? err.detail : "Failed to evaluate alerts"
      )
    },
  })

  if (Number.isNaN(projectId)) {
    return (
      <DashboardLayout title="Invalid project">
        <p className="text-slate-400">Invalid project ID.</p>
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
      title="Project Alerts"
      subtitle={project?.name ?? "Rule-based monitoring"}
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button
          render={<Link to={`/projects/${projectId}`} />}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Back to project
        </Button>
        <span className="flex items-center gap-2 text-sm text-amber-300/90">
          <Bell className="size-4" />
          In-app alerts only — no email or push notifications
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <AlertForm
            onSubmit={(data) => createMutation.mutate(data)}
            loading={createMutation.isPending}
            error={formError}
          />
          {alertsLoading ? (
            <LoadingState label="Loading alerts…" />
          ) : (
            <AlertList
              projectId={projectId}
              alerts={alertsData?.alerts ?? []}
            />
          )}
          <AlertEvaluationPanel
            onEvaluate={() => evaluateMutation.mutate()}
            loading={evaluateMutation.isPending}
            evaluation={evaluation}
          />
        </div>
        <AlertTypeHelp />
      </div>
    </DashboardLayout>
  )
}
