import { ExternalLink } from "lucide-react"
import { useNavigate } from "react-router-dom"
import type { DebateItem } from "@/api/dashboard"
import { DashboardSection } from "@/components/dashboard/DashboardSection"
import { dashCardStatic } from "@/lib/dash-classes"
import { formatLiveDebateTimeAgo } from "@/lib/formatTimeAgo"
import { platformDotColor, platformLabel } from "@/lib/platformDots"
import { cn } from "@/lib/utils"

type DebateListProps = {
  debates: DebateItem[]
}

export function DebateList({ debates }: DebateListProps) {
  const navigate = useNavigate()

  return (
    <DashboardSection title="Latest opinion debates">
      <div className={cn(dashCardStatic, "overflow-hidden")}>
        {debates.map((d, i) => (
          <article
            key={d.id}
            className={cn(
              "p-5",
              i < debates.length - 1 && "border-b border-[var(--dash-border)]"
            )}
          >
            <div className="flex gap-3">
              {d.thumbnail && (
                <img
                  src={d.thumbnail}
                  alt=""
                  className="h-16 w-24 shrink-0 rounded-lg object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/search?q=${encodeURIComponent(d.query)}`)
                  }
                  className="w-full border-none bg-transparent p-0 text-left"
                >
                  <p className="text-[15px] font-semibold text-[var(--dash-text)] hover:text-[var(--dash-accent)]">
                    {d.title}
                  </p>
                </button>
                <span
                  className="mt-2 inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium"
                  style={{
                    background: "var(--dash-surface-alt)",
                    color: platformDotColor(d.platform),
                  }}
                >
                  {platformLabel(d.platform)}
                </span>
                <p className="mt-2 line-clamp-2 text-[13px] text-[var(--dash-text-mid)]">
                  {d.summary}
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-sm bg-[var(--dash-surface-alt)]">
                  <div className="flex h-full">
                    <div
                      className="bg-[var(--dash-pos)]"
                      style={{ width: `${d.positive_pct}%` }}
                    />
                    <div
                      className="bg-[var(--dash-neg)]"
                      style={{ width: `${d.negative_pct}%` }}
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-[var(--dash-text-faint)]">
                  {formatLiveDebateTimeAgo(d.time_ago)}
                </p>
                {d.source_url && (
                  <div className="mt-3 flex items-center justify-between border-t border-[var(--dash-border)] pt-2.5">
                    <span className="flex max-w-[60%] items-center gap-1.5 truncate text-xs text-[var(--dash-text-faint)]">
                      <ExternalLink className="size-3" strokeWidth={2} />
                      {d.source_label || "Source"}
                    </span>
                    <a
                      href={d.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex shrink-0 items-center gap-1 text-xs font-semibold text-[var(--dash-accent)] no-underline hover:underline"
                    >
                      Visit source
                      <ExternalLink className="size-2.5" strokeWidth={2} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </DashboardSection>
  )
}
