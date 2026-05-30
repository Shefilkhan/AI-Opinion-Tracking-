import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { FolderKanban, Loader2, Sparkles } from "lucide-react"
import { getAnalyticsOverview } from "@/api/analytics"
import { apiRequest } from "@/api/client"
import { getCurrentUser } from "@/api/auth"
import { getProjects } from "@/api/projects"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cardInteractive, btnPrimary } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type HealthResponse = {
  status: string
  message: string
}

async function fetchHealth(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>("/api/health")
}

export function DashboardPage() {
  const userQuery = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
  })

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  })

  const healthQuery = useQuery({
    queryKey: ["backend-health"],
    queryFn: fetchHealth,
    retry: 1,
  })

  const connected = healthQuery.data?.status === "ok"
  const user = userQuery.data
  const projects = projectsQuery.data?.projects ?? []
  const latestProject = projects[0]

  const analyticsQuery = useQuery({
    queryKey: ["analytics-overview", latestProject?.id],
    queryFn: () => getAnalyticsOverview(latestProject!.id),
    enabled: !!latestProject?.id,
  })

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle={user ? `Welcome back, ${user.name}` : "Overview"}
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className={cardInteractive}>
          <CardHeader>
            <CardTitle className="text-white">Your projects</CardTitle>
          </CardHeader>
          <CardContent>
            {projectsQuery.isLoading ? (
              <Loader2 className="size-6 animate-spin text-blue-400" />
            ) : (
              <p className="text-4xl font-bold text-white">
                {projectsQuery.data?.total ?? 0}
              </p>
            )}
            <p className="mt-2 text-sm text-slate-400">Active tracking projects</p>
            <Button
              render={<Link to="/projects" />}
              className={cn("mt-4 w-full gap-2", btnPrimary)}
            >
              <FolderKanban className="size-4" />
              View projects
            </Button>
          </CardContent>
        </Card>

        <Card className={cardInteractive}>
          <CardHeader>
            <CardTitle className="text-white">Backend status</CardTitle>
          </CardHeader>
          <CardContent>
            {healthQuery.isLoading && (
              <div className="flex items-center gap-2 text-slate-300">
                <Loader2 className="size-4 animate-spin" />
                Checking…
              </div>
            )}
            {healthQuery.isError && (
              <Badge variant="destructive">Disconnected</Badge>
            )}
            {healthQuery.isSuccess && (
              <>
                <Badge
                  className={
                    connected
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-rose-500/15 text-rose-400"
                  }
                >
                  {connected ? "Connected" : "Unknown"}
                </Badge>
                {healthQuery.data?.message && (
                  <p className="mt-2 text-xs text-slate-400">
                    {healthQuery.data.message}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className={cn(cardInteractive, "md:col-span-2 lg:col-span-1")}>
          <CardHeader>
            <CardTitle className="text-white">Quick start</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-400">
            <p>
              Create a project, seed mentions, run Analyze Sentiment, then explore
              analytics on the project page.
            </p>
            <Button
              render={<Link to="/projects/new" />}
              variant="outline"
              className="w-full"
            >
              Create new project
            </Button>
          </CardContent>
        </Card>

        {latestProject && (
          <Card className={cn(cardInteractive, "md:col-span-2")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Sparkles className="size-4 text-violet-400" />
                Latest project — {latestProject.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsQuery.isLoading && (
                <Loader2 className="size-5 animate-spin text-blue-400" />
              )}
              {analyticsQuery.isSuccess && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {analyticsQuery.data.total_mentions}
                    </p>
                    <p className="text-xs text-slate-500">Mentions</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-400">
                      {analyticsQuery.data.total_analyzed > 0
                        ? `${analyticsQuery.data.positive_percentage}%`
                        : "—"}
                    </p>
                    <p className="text-xs text-slate-500">Positive</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-rose-400">
                      {analyticsQuery.data.total_analyzed > 0
                        ? `${analyticsQuery.data.negative_percentage}%`
                        : "—"}
                    </p>
                    <p className="text-xs text-slate-500">Negative</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-300">
                      {analyticsQuery.data.total_analyzed}
                    </p>
                    <p className="text-xs text-slate-500">Analyzed</p>
                  </div>
                </div>
              )}
              <Button
                render={<Link to={`/projects/${latestProject.id}`} />}
                variant="outline"
                className="mt-4 w-full"
              >
                Open analytics dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        {projects.length > 0 && (
          <Card className={cn(cardInteractive, "md:col-span-2 lg:col-span-3")}>
            <CardHeader>
              <CardTitle className="text-white">Recent projects</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-slate-800/80">
                {projects.slice(0, 5).map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-white">{p.name}</p>
                      <p className="text-xs text-slate-500 capitalize">
                        {p.tracking_frequency} ·{" "}
                        {new Date(p.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      render={<Link to={`/projects/${p.id}`} />}
                      variant="outline"
                      size="sm"
                    >
                      Open
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
