import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

type PlaceholderPageProps = {
  title: string
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center shadow-xl">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="mt-3 text-slate-400">Coming soon — this page is a placeholder.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button
            render={<Link to="/" />}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            Back to Home
          </Button>
          {title !== "Dashboard" && (
            <Button render={<Link to="/dashboard" />}>View Dashboard</Button>
          )}
        </div>
      </div>
    </div>
  )
}
