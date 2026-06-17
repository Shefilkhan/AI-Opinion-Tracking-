import { ArrowUpRight, ExternalLink } from "lucide-react"
import { useNavigate } from "react-router-dom"
import type { DebateItem } from "@/api/dashboard"
import { DashboardSection } from "@/components/dashboard/DashboardSection"
import { DebateMedia } from "@/components/dashboard/DebateMedia"
import { SentimentSplitBar } from "@/components/dashboard/SentimentSplitBar"
import { dashCardStatic } from "@/lib/dash-classes"
import { formatLiveDebateTimeAgo } from "@/lib/formatTimeAgo"
import { cn } from "@/lib/utils"

type DebateListProps = {
  debates: DebateItem[]
}

export function DebateList({ debates }: DebateListProps) {
  const navigate = useNavigate()

  return (
    <DashboardSection
      title="Latest opinion debates"
      description="Recent posts and headlines from live sources"
    >
      <div className="flex flex-col gap-3">
        {debates.map((d) => (
          <article
            key={d.id}
            className={cn(
              dashCardStatic,
              "group overflow-hidden p-0"
            )}
          >
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch sm:p-4">
              <DebateMedia
                platform={d.platform}
                thumbnail={d.thumbnail}
                title={d.title}
                sourceLabel={d.source_label}
              />

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/search?q=${encodeURIComponent(d.query)}`)
                    }
                    className="min-w-0 flex-1 border-none bg-transparent p-0 text-left"
                  >
                    <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-[var(--dash-text)] transition-colors group-hover:text-[var(--dash-accent)]">
                      {d.title}
                    </h3>
                  </button>
                  <span className="shrink-0 whitespace-nowrap text-[11px] text-[var(--dash-text-faint)]">
                    {formatLiveDebateTimeAgo(d.time_ago)}
                  </span>
                </div>

                <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[var(--dash-text-mid)]">
                  {d.summary}
                </p>

                <div className="mt-3">
                  <SentimentSplitBar
                    positive={d.positive_pct}
                    negative={d.negative_pct}
                    neutral={d.neutral_pct}
                  />
                </div>

                {d.source_url && (
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--dash-border)] pt-3">
                    <span className="flex min-w-0 items-center gap-1.5 truncate text-[11px] text-[var(--dash-text-faint)]">
                      <ExternalLink
                        className="size-3 shrink-0"
                        strokeWidth={2}
                        aria-hidden
                      />
                      <span className="truncate">
                        {d.source_label || "Source"}
                      </span>
                    </span>
                    <a
                      href={d.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-[var(--dash-accent)] no-underline transition-opacity hover:opacity-80"
                    >
                      Visit source
                      <ArrowUpRight className="size-3.5" strokeWidth={2} />
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
