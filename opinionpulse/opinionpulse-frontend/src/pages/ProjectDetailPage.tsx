import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Database, Trash2 } from "lucide-react"
import { ApiError } from "@/api/client"
import { deleteProject, getProject, updateProject } from "@/api/projects"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { seedMentions } from "@/api/mentions"
import { MentionFeed } from "@/components/mentions/MentionFeed"
import { MentionFilters, type MentionFilterValues } from "@/components/mentions/MentionFilters"
import { MentionForm } from "@/components/mentions/MentionForm"
import { MentionStats } from "@/components/mentions/MentionStats"
import { AnalyzeSentimentButton } from "@/components/sentiment/AnalyzeSentimentButton"
import { SentimentSummaryCards } from "@/components/sentiment/SentimentSummaryCards"
import { SentimentTrendChart } from "@/components/sentiment/SentimentTrendChart"
import { KeywordManager } from "@/components/projects/KeywordManager"
import { SourceSelector } from "@/components/projects/SourceSelector"
import {
  ProjectForm,
  type ProjectFormValues,
} from "@/components/projects/ProjectForm"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingState } from "@/components/ui/LoadingState"
import { cardSurface } from "@/lib/ui-classes"

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mentionFilters, setMentionFilters] = useState<MentionFilterValues>({
    source: "all",
    search: "",
  })

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

  const seedMutation = useMutation({
    mutationFn: () => seedMentions(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentions", projectId] })
      queryClient.invalidateQueries({ queryKey: ["mention-stats", projectId] })
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
        <LoadingState label="Loading project…" />
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
            <Card className={cardSurface}>
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
            <Card className={cardSurface}>
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
        </div>
      </div>

      <section className="mt-10 space-y-6 border-t border-slate-800/80 pt-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Mentions</h2>
            <p className="text-sm text-slate-400">
              Collect and review public opinion text before API integrations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
            >
              <Database className="size-4" />
              {seedMutation.isPending ? "Adding samples…" : "Add sample mentions"}
            </Button>
            <AnalyzeSentimentButton projectId={projectId} />
          </div>
        </div>

        <MentionStats projectId={projectId} />

        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Sentiment analysis</h3>
          <SentimentSummaryCards projectId={projectId} />
          <SentimentTrendChart projectId={projectId} />
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <MentionForm projectId={projectId} />
          </div>
          <div className="space-y-4 lg:col-span-2">
            <MentionFilters values={mentionFilters} onChange={setMentionFilters} />
            <MentionFeed projectId={projectId} filters={mentionFilters} />
          </div>
        </div>
      </section>
    </DashboardLayout>
  )
}
