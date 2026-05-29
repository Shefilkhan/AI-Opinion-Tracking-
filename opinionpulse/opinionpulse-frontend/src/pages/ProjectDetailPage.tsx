import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, BarChart3, Trash2 } from "lucide-react"
import { ApiError } from "@/api/client"
import { deleteProject, getProject, updateProject } from "@/api/projects"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { KeywordManager } from "@/components/projects/KeywordManager"
import { SourceSelector } from "@/components/projects/SourceSelector"
import {
  ProjectForm,
  type ProjectFormValues,
} from "@/components/projects/ProjectForm"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId),
    enabled: !Number.isNaN(projectId),
  })

  const [formValues, setFormValues] = useState<ProjectFormValues>({
    name: "",
    description: "",
    tracking_frequency: "daily",
  })

  const updateMutation = useMutation({
    mutationFn: (data: ProjectFormValues) =>
      updateProject(projectId, {
        name: data.name.trim(),
        description: data.description.trim() || undefined,
        tracking_frequency: data.tracking_frequency,
      }),
    onSuccess: () => {
      setEditing(false)
      setError(null)
      queryClient.invalidateQueries({ queryKey: ["project", projectId] })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.detail : "Failed to update project")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      navigate("/projects")
    },
  })

  function startEditing() {
    if (!project) return
    setFormValues({
      name: project.name,
      description: project.description ?? "",
      tracking_frequency: project.tracking_frequency as ProjectFormValues["tracking_frequency"],
    })
    setEditing(true)
  }

  if (Number.isNaN(projectId)) {
    return (
      <DashboardLayout title="Project not found">
        <p className="text-slate-400">Invalid project ID.</p>
      </DashboardLayout>
    )
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Loading…">
        <p className="text-slate-400">Loading project…</p>
      </DashboardLayout>
    )
  }

  if (isError || !project) {
    return (
      <DashboardLayout title="Project not found">
        <p className="text-slate-400">This project does not exist or you do not have access.</p>
        <Button render={<Link to="/projects" />} className="mt-4">
          Back to projects
        </Button>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title={project.name} subtitle="Project details and tracking setup">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button render={<Link to="/projects" />} variant="outline" size="sm" className="gap-2">
          <ArrowLeft className="size-4" />
          All projects
        </Button>
        <Badge className="capitalize">{project.tracking_frequency}</Badge>
        <div className="ml-auto flex gap-2">
          {!editing && (
            <Button variant="outline" size="sm" onClick={startEditing}>
              Edit project
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-rose-400"
            onClick={() => {
              if (confirm("Delete this project?")) deleteMutation.mutate()
            }}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {editing ? (
            <Card className="border-slate-800/60 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-white">Edit project</CardTitle>
              </CardHeader>
              <CardContent>
                <ProjectForm
                  values={formValues}
                  onChange={setFormValues}
                  onSubmit={(e) => {
                    e.preventDefault()
                    updateMutation.mutate(formValues)
                  }}
                  submitLabel="Save changes"
                  loading={updateMutation.isPending}
                  error={error}
                />
                <Button
                  variant="ghost"
                  className="mt-2 w-full"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-800/60 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-white">Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-400">
                {project.description ? (
                  <p className="text-slate-300">{project.description}</p>
                ) : (
                  <p className="italic">No description</p>
                )}
                <p>
                  Created: {new Date(project.created_at).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          )}

          <SourceSelector projectId={projectId} />
        </div>

        <div className="space-y-6">
          <KeywordManager projectId={projectId} />

          <Card className="border-slate-800/60 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <BarChart3 className="size-5 text-blue-400" />
                Analytics preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">
                Mock summary — real sentiment data will appear here after API
                integrations are enabled.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-slate-950/80 p-3">
                  <p className="text-lg font-bold text-emerald-400">—</p>
                  <p className="text-xs text-slate-500">Positive</p>
                </div>
                <div className="rounded-lg bg-slate-950/80 p-3">
                  <p className="text-lg font-bold text-slate-400">—</p>
                  <p className="text-xs text-slate-500">Neutral</p>
                </div>
                <div className="rounded-lg bg-slate-950/80 p-3">
                  <p className="text-lg font-bold text-rose-400">—</p>
                  <p className="text-xs text-slate-500">Negative</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
