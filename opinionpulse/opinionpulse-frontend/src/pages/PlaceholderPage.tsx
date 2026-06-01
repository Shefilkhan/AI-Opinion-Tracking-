import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cardSurface, pageShell } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type PlaceholderPageProps = {
  title: string
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className={cn("flex min-h-screen flex-col items-center justify-center px-4", pageShell)}>
      <div className={cn("max-w-md p-8 text-center", cardSurface)}>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="mt-3 text-muted-foreground">Coming soon — this page is a placeholder.</p>
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
