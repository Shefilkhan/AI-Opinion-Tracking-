import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ExternalLink, MessageSquare } from "lucide-react"
import { getAllMentions } from "@/api/mentions"
import { getProjects } from "@/api/projects"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { SentimentBadge } from "@/components/sentiment/SentimentBadge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LoadingState } from "@/components/ui/LoadingState"
import { cardSurface, inputSurface, selectSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

export function MentionsPage() {
  const [projectId, setProjectId] = useState<string>("all")
  const [source, setSource] = useState("all")
  const [sentiment, setSentiment] = useState("all")
  const [search, setSearch] = useState("")

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  })

  const { data, isLoading } = useQuery({
    queryKey: ["all-mentions", projectId, source, sentiment, search],
    queryFn: () =>
      getAllMentions({
        project_id: projectId === "all" ? undefined : Number(projectId),
        source,
        sentiment: sentiment as "all",
        search,
        limit: 50,
      }),
  })

  return (
    <DashboardLayout
      title="All Mentions"
      subtitle="Mentions across all your projects"
    >
      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search mention text…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={cn("min-w-[200px] flex-1 rounded-lg px-3 py-2 text-sm", inputSurface)}
        />
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className={cn(selectSurface, "h-10 min-w-[160px]")}
        >
          <option value="all">All projects</option>
          {projects?.projects.map((p) => (
            <option key={p.id} value={String(p.id)}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className={cn(selectSurface, "h-10")}
        >
          <option value="all">All sources</option>
          <option value="reddit">Reddit</option>
          <option value="youtube">YouTube</option>
          <option value="gdelt">GDELT</option>
          <option value="manual">Manual</option>
        </select>
        <select
          value={sentiment}
          onChange={(e) => setSentiment(e.target.value)}
          className={cn(selectSurface, "h-10")}
        >
          <option value="all">All sentiment</option>
          <option value="positive">Positive</option>
          <option value="neutral">Neutral</option>
          <option value="negative">Negative</option>
          <option value="unanalyzed">Not analyzed</option>
        </select>
      </div>

      {isLoading ? (
        <LoadingState label="Loading mentions…" />
      ) : !data?.mentions.length ? (
        <Card className={cardSurface}>
          <CardContent className="py-12 text-center">
            <MessageSquare className="mx-auto size-10 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">No mentions found.</p>
            <Button render={<Link to="/projects" />} className="mt-4" variant="outline">
              Go to projects
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {data.mentions.map((m) => (
            <li key={m.id}>
              <Card className={cardSurface}>
                <CardContent className="pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="capitalize">{m.source}</Badge>
                    <Badge variant="outline" className="text-primary">
                      {m.project_name}
                    </Badge>
                    <SentimentBadge sentiment={m.sentiment} />
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm text-foreground/80">{m.text}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      render={<Link to={`/projects/${m.project_id}`} />}
                      variant="outline"
                      size="sm"
                    >
                      Open project
                    </Button>
                    {m.url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-primary"
                        render={
                          <a href={m.url} target="_blank" rel="noopener noreferrer" />
                        }
                      >
                        <ExternalLink className="size-3.5" />
                        Source
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </DashboardLayout>
  )
}
