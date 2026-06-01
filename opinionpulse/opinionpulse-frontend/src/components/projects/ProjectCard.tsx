import { Link } from "react-router-dom"
import { Calendar, Trash2 } from "lucide-react"
import type { Project } from "@/api/projects"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cardInteractive, btnPrimary } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type ProjectCardProps = {
  project: Project
  onDelete: (id: number) => void
  deleting?: boolean
}

export function ProjectCard({ project, onDelete, deleting }: ProjectCardProps) {
  const created = new Date(project.created_at).toLocaleDateString()

  return (
    <Card className={cn(cardInteractive, "group overflow-hidden")}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg text-foreground transition-colors group-hover:text-primary">
            {project.name}
          </CardTitle>
          <Badge variant="secondary" className="shrink-0 capitalize">
            {project.tracking_frequency}
          </Badge>
        </div>
        {project.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="size-3.5" />
          Created {created}
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button
          render={<Link to={`/projects/${project.id}`} />}
          className={cn("flex-1", btnPrimary)}
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
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </CardFooter>
    </Card>
  )
}
