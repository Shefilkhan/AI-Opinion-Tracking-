import { useNavigate } from "react-router-dom"
import type { SearchResponse } from "@/lib/api/types"
import { proCard, cardTitle } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type KeywordsSidebarProps = {
  data: SearchResponse
}

export function KeywordsSidebar({ data }: KeywordsSidebarProps) {
  const navigate = useNavigate()

  return (
    <aside className="flex flex-col gap-5">
      <div className={cn(proCard, "p-5")}>
        <h3 className={cardTitle}>
          Top Keywords
        </h3>
        <ol className="mt-4 space-y-2.5">
          {data.trending_keywords.map((k, i) => (
            <li
              key={k.word}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="truncate font-medium text-foreground">
                <span className="mr-2 text-xs text-muted-foreground">{i + 1}.</span>
                {k.word}
              </span>
              <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                {k.count.toLocaleString()}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className={cn(proCard, "p-5")}>
        <h3 className={cardTitle}>
          Related Topics
        </h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {data.related_topics.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() =>
                navigate(`/search?q=${encodeURIComponent(t.replace(/^#/, ""))}`)
              }
              className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:bg-accent hover:text-accent-foreground"
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
