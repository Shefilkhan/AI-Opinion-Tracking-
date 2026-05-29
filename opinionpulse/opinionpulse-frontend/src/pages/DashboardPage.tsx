import { Link, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Loader2, LogOut } from "lucide-react"
import { apiRequest } from "@/api/client"
import { getCurrentUser, logoutUser, type User } from "@/api/auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type HealthResponse = {
  status: string
  message: string
}

async function fetchHealth(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>("/api/health")
}

export function DashboardPage() {
  const navigate = useNavigate()

  const userQuery = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    retry: false,
  })

  const healthQuery = useQuery({
    queryKey: ["backend-health"],
    queryFn: fetchHealth,
    retry: 1,
  })

  function handleLogout() {
    logoutUser()
    navigate("/")
  }

  if (userQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <Loader2 className="size-8 animate-spin text-blue-400" />
      </div>
    )
  }

  if (userQuery.isError) {
    logoutUser()
    navigate("/login", { replace: true })
    return null
  }

  const user = userQuery.data as User
  const connected = healthQuery.data?.status === "ok"

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="mt-1 text-slate-400">Welcome back, {user.name}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="size-4" />
            Logout
          </Button>
        </div>

        <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-4">
            <p className="text-sm font-medium text-slate-300">Logged in as</p>
            <p className="mt-1 text-white">{user.name}</p>
            <p className="text-sm text-slate-400">{user.email}</p>
            <Badge className="mt-2 bg-blue-500/15 text-blue-300">{user.role}</Badge>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-4">
            <p className="text-sm text-slate-500">Backend Status</p>
            {healthQuery.isLoading && (
              <div className="mt-2 flex items-center gap-2 text-slate-300">
                <Loader2 className="size-4 animate-spin" />
                Checking…
              </div>
            )}
            {healthQuery.isError && (
              <Badge variant="destructive" className="mt-2">
                Disconnected
              </Badge>
            )}
            {healthQuery.isSuccess && (
              <div className="mt-2">
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
                  <p className="mt-1 text-xs text-slate-400">
                    {healthQuery.data.message}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <Button render={<Link to="/" />} variant="outline" className="w-full">
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  )
}
