import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"

type HealthResponse = {
  status: string
  message: string
}

async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE}/api/health`)
  if (!response.ok) {
    throw new Error("Backend unreachable")
  }
  return response.json()
}

export function DashboardPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["backend-health"],
    queryFn: fetchHealth,
    retry: 1,
  })

  const connected = data?.status === "ok"

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center shadow-xl">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-3 text-slate-400">Placeholder — backend connection test.</p>

        <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950/80 p-4">
          <p className="text-sm text-slate-500">Backend Status</p>
          {isLoading && (
            <div className="mt-2 flex items-center justify-center gap-2 text-slate-300">
              <Loader2 className="size-4 animate-spin" />
              Checking…
            </div>
          )}
          {isError && (
            <div className="mt-2 space-y-1">
              <Badge variant="destructive">Disconnected</Badge>
              <p className="text-xs text-slate-500">
                {(error as Error).message}. Start the API with{" "}
                <code className="text-slate-400">uvicorn app.main:app --reload</code>
              </p>
            </div>
          )}
          {!isLoading && !isError && (
            <div className="mt-2 space-y-1">
              <Badge
                className={
                  connected
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-rose-500/15 text-rose-400"
                }
              >
                {connected ? "Connected" : "Unknown"}
              </Badge>
              {data?.message && (
                <p className="text-xs text-slate-400">{data.message}</p>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button render={<Link to="/" />} variant="outline" className="gap-2">
            <ArrowLeft className="size-4" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  )
}
