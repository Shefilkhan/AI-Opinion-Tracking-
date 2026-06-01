import { Link } from "react-router-dom"
import { BarChart3, FolderPlus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { btnPrimary, cardSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type DashboardHeroProps = {
  userName?: string
}

export function DashboardHero({ userName }: DashboardHeroProps) {
  return (
    <div className={cn("p-4 sm:p-6 md:p-8", cardSurface)}>
      <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl md:text-3xl">
        Welcome back{userName ? `, ${userName}` : ""}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
        Track public opinion, collect real-time data, analyze sentiment, and ask your
        AI assistant.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap">
        <Button
          render={<Link to="/projects/new" />}
          className={cn("h-11 w-full gap-2 sm:w-auto", btnPrimary)}
        >
          <FolderPlus className="size-4" aria-hidden />
          Create project
        </Button>
        <Button
          render={<Link to="/projects" />}
          variant="outline"
          className="h-11 w-full gap-2 sm:w-auto"
        >
          Collect data
        </Button>
        <Button
          render={<Link to="/projects" />}
          variant="outline"
          className="h-11 w-full gap-2 sm:w-auto"
        >
          <BarChart3 className="size-4" aria-hidden />
          View reports
        </Button>
        <Button
          render={<Link to="/projects" />}
          variant="outline"
          className="h-11 w-full gap-2 sm:w-auto"
        >
          <Sparkles className="size-4" aria-hidden />
          AI assistant
        </Button>
      </div>
    </div>
  )
}
