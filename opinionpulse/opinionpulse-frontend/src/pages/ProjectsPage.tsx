import { Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FolderKanban, Plus } from "lucide-react"
import { deleteProject, getProjects } from "@/api/projects"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { ProjectCard } from "@/components/projects/ProjectCard"
import { Button } from "@/components/ui/button"

export function ProjectsPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })

  return (
    <DashboardLayout
      title="Projects"
      subtitle="Manage your opinion tracking projects"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-slate-400">
          {data?.total ?? 0} project{data?.total === 1 ? "" : "s"}
        </p>
        <Button
          render={<Link to="/projects/new" />}
          className="gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white"
        >
          <Plus className="size-4" />
          Create Project
        </Button>
      </div>

      {isLoading && (
        <p className="text-slate-400">Loading projects…</p>
      )}

      {!isLoading && data?.projects.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 py-16 text-center">
          <FolderKanban className="mx-auto size-12 text-slate-600" />
          <h3 className="mt-4 text-lg font-semibold text-white">No projects yet</h3>
          <p className="mt-2 text-sm text-slate-400">
            Create your first tracking project to get started.
          </p>
          <Button
            render={<Link to="/projects/new" />}
            className="mt-6 bg-gradient-to-r from-blue-600 to-violet-600 text-white"
          >
            Create Project
          </Button>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data?.projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onDelete={(id) => {
              if (confirm("Delete this project? This cannot be undone.")) {
                deleteMutation.mutate(id)
              }
            }}
            deleting={deleteMutation.isPending}
          />
        ))}
      </div>
    </DashboardLayout>
  )
}
