import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { FolderKanban, Loader2 } from "lucide-react"
import { apiRequest } from "@/api/client"
import { getCurrentUser } from "@/api/auth"
import { getProjects } from "@/api/projects"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle={user ? `Welcome back, ${user.name}` : "Overview"}
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-slate-800/60 bg-slate-900/50">
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
              className="mt-4 w-full gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white"
            >
              <FolderKanban className="size-4" />
              View projects
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-800/60 bg-slate-900/50">
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

        <Card className="border-slate-800/60 bg-slate-900/50 md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-white">Quick start</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-400">
            <p>Create a project, add keywords, and enable Reddit, YouTube, or GDELT sources.</p>
            <Button
              render={<Link to="/projects/new" />}
              variant="outline"
              className="w-full"
            >
              Create new project
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
