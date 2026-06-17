import { useRef } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { TrendingTopic } from "@/api/dashboard"
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState"
import { DashboardSection } from "@/components/dashboard/DashboardSection"
import { dashCardStatic, dashSentimentBadge } from "@/lib/dash-classes"
import { cn } from "@/lib/utils"

type TrendingTopicsRowProps = {
  topics: TrendingTopic[]
}

export function TrendingTopicsRow({ topics }: TrendingTopicsRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  function scroll(dir: "left" | "right") {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" })
  }

  return (
    <DashboardSection
      title="Trending right now"
      description="Most discussed topics across social media in the last 24 hours"
      action={
        <button
          type="button"
          className="cursor-pointer border-none bg-transparent text-[13px] font-medium text-[var(--dash-accent)]"
          onClick={() => navigate("/search")}
        >
          View all →
        </button>
      }
    >
      {topics.length === 0 ? (
        <div className={cn(dashCardStatic, "overflow-hidden")}>
          <DashboardEmptyState
            title="Nothing trending yet"
            description="Check back soon, or run a search to get started"
          />
        </div>
      ) : (
        <div className="relative px-1">
          <button
            type="button"
            onClick={() => scroll("left")}
            className={cn(
              dashCardStatic,
              "absolute -left-3 top-1/2 z-10 hidden size-8 -translate-y-1/2 items-center justify-center md:flex"
            )}
            aria-label="Scroll left"
          >
            <ChevronLeft className="size-4 text-[var(--dash-text-mid)]" strokeWidth={2} />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-3.5 overflow-x-auto pb-1 scrollbar-thin"
          >
            {topics.map((t) => {
              const sentimentKey =
                t.sentiment === "positive" || t.sentiment === "negative"
                  ? t.sentiment
                  : "mixed"
              return (
                <button
                  key={t.name}
                  type="button"
                  onClick={() =>
                    navigate(
                      `/search?q=${encodeURIComponent((t.query || t.name).replace(/^#/, ""))}`
                    )
                  }
                  className={cn(
                    dashCardStatic,
                    "flex min-w-[260px] shrink-0 flex-col gap-2.5 p-4 text-left transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-[var(--dash-shadow-hover)]"
                  )}
                >
                  <p className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--dash-text)]">
                    {t.name}
                  </p>
                  <p className="text-xs text-[var(--dash-text-faint)]">
                    {t.mentions} mentions
                  </p>
                  <div className="mt-1 flex items-center justify-between">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
                        dashSentimentBadge[sentimentKey]
                      )}
                    >
                      {t.sentiment}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        t.trend === "up"
                          ? "text-[var(--dash-pos)]"
                          : "text-[var(--dash-neg)]"
                      )}
                    >
                      {t.trend === "up" ? "↑" : "↓"}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => scroll("right")}
            className={cn(
              dashCardStatic,
              "absolute -right-3 top-1/2 z-10 hidden size-8 -translate-y-1/2 items-center justify-center md:flex"
            )}
            aria-label="Scroll right"
          >
            <ChevronRight className="size-4 text-[var(--dash-text-mid)]" strokeWidth={2} />
          </button>
        </div>
      )}
    </DashboardSection>
  )
}

export function TrendingTopicsSkeleton() {
  return (
    <div className="flex gap-3.5 overflow-hidden">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(dashCardStatic, "h-[130px] min-w-[260px] shrink-0 p-4")}
        >
          <div className="dash-skeleton mb-3 h-4 w-3/4 rounded bg-[var(--dash-surface-alt)]" />
          <div className="dash-skeleton h-3 w-1/2 rounded bg-[var(--dash-surface-alt)]" />
        </div>
      ))}
    </div>
  )
}
