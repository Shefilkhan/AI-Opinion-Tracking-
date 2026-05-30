import { Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FolderKanban, Plus } from "lucide-react"
import { deleteProject, getProjects } from "@/api/projects"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { ProjectCard } from "@/components/projects/ProjectCard"
import { Button } from "@/components/ui/button"
import { ProjectCardSkeleton } from "@/components/ui/Skeleton"
import { btnPrimary, panelSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

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
          className={cn("gap-2", btnPrimary)}
        >
          <Plus className="size-4" />
          Create Project
        </Button>
      </div>

      {isLoading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && data?.projects.length === 0 && (
        <div
          className={cn(
            panelSurface,
            "border-dashed border-slate-700/80 py-20 text-center"
          )}
        >
          <FolderKanban className="mx-auto size-12 text-slate-600" />
          <h3 className="mt-4 text-lg font-semibold text-white">No projects yet</h3>
          <p className="mt-2 text-sm text-slate-400">
            Create your first tracking project to get started.
          </p>
          <Button
            render={<Link to="/projects/new" />}
            className={cn("mt-6", btnPrimary)}
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
