import { Link } from "react-router-dom"
import { Calendar, Trash2 } from "lucide-react"
import type { Project } from "@/api/projects"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type ProjectCardProps = {
  project: Project
  onDelete: (id: number) => void
  deleting?: boolean
}

export function ProjectCard({ project, onDelete, deleting }: ProjectCardProps) {
  const created = new Date(project.created_at).toLocaleDateString()

  return (
    <Card className="border-slate-800/60 bg-slate-900/50">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg text-white">{project.name}</CardTitle>
          <Badge variant="secondary" className="shrink-0 capitalize">
            {project.tracking_frequency}
          </Badge>
        </div>
        {project.description && (
          <p className="line-clamp-2 text-sm text-slate-400">{project.description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="size-3.5" />
          Created {created}
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button
          render={<Link to={`/projects/${project.id}`} />}
          className="flex-1 bg-gradient-to-r from-blue-600 to-violet-600 text-white"
        >
          View
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onDelete(project.id)}
          disabled={deleting}
          aria-label="Delete project"
        >
          <Trash2 className="size-4 text-rose-400" />
        </Button>
      </CardFooter>
    </Card>
  )
}
