import { ExternalLink } from "lucide-react"
import { useNavigate } from "react-router-dom"
import type { DebateItem } from "@/api/dashboard"
import { platformBadge } from "@/lib/api/sentiment"
import { sectionTitle } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type DebateListProps = {
  debates: DebateItem[]
}

export function DebateList({ debates }: DebateListProps) {
  const navigate = useNavigate()

  return (
    <section>
      <h2 className={cn(sectionTitle, "mb-4")}>
        Latest Opinion Debates
      </h2>
      <ul className="divide-y divide-border">
        {debates.map((d) => {
          const plat = platformBadge(d.platform)
          return (
            <li key={d.id} className="py-4">
              <div className="flex gap-3">
                {d.thumbnail && (
                  <img
                    src={d.thumbnail}
                    alt={d.title}
                    className="h-16 w-24 shrink-0 rounded-lg object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/search?q=${encodeURIComponent(d.query)}`)
                    }
                    className="w-full text-left"
                  >
                    <p className="text-[15px] font-semibold text-foreground hover:text-primary">
                      {d.title}
                    </p>
                  </button>
                  <span
                    className={cn(
                      "mt-2 inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold",
                      plat.className
                    )}
                  >
                    {plat.label}
                  </span>
                  <p className="mt-2 line-clamp-2 text-[13px] text-muted-foreground">
                    {d.summary}
                  </p>
                  <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="bg-green-500"
                      style={{ width: `${d.positive_pct}%` }}
                      title={`${d.positive_pct}% positive`}
                    />
                    <div
                      className="bg-red-500"
                      style={{ width: `${d.negative_pct}%` }}
                      title={`${d.negative_pct}% negative`}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{d.time_ago}</p>
                  {d.source_url && (
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
                      <span className="flex max-w-[60%] items-center gap-1.5 truncate text-xs text-muted-foreground">
                        <ExternalLink size={11} />
                        {d.source_label || "Source"}
                      </span>
                      <a
                        href={d.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary transition-colors hover:underline"
                      >
                        Visit source <ExternalLink size={10} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
