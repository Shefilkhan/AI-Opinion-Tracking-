import { Link } from "react-router-dom"
import type { RecentProject } from "@/api/dashboard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cardSurface } from "@/lib/ui-classes"

export function RecentProjectsPanel({ projects }: { projects: RecentProject[] }) {
  return (
    <Card className={cardSurface}>
      <CardHeader>
        <CardTitle className="text-foreground">Recent projects</CardTitle>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              No projects yet. Create your first project to start tracking opinions.
            </p>
            <Button render={<Link to="/projects/new" />} className="mt-4">
              Create project
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {projects.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 p-3"
              >
                <div>
                  <p className="font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.mentions_count} mentions · {p.keywords_count} keywords · +
                    {p.positive_percentage.toFixed(0)}% / -{p.negative_percentage.toFixed(0)}%
                  </p>
                </div>
                <Button
                  render={<Link to={`/projects/${p.id}`} />}
                  variant="outline"
                  className="h-11 min-w-[4.5rem] shrink-0 sm:h-8"
                >
                  Open
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
