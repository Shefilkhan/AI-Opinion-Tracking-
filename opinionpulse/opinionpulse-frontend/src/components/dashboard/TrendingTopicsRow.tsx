import { useRef } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from "lucide-react"
import type { TrendingTopic } from "@/api/dashboard"
import { PageSection } from "@/components/layout/PageSection"
import { proCard } from "@/lib/ui-classes"
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
    <PageSection
      title="Trending Right Now"
      description="Most discussed topics across social media in the last 24 hours"
    >
      <div className="relative">
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute -left-2 top-1/2 z-10 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-sm md:flex"
          aria-label="Scroll left"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin"
        >
          {topics.map((t) => (
            <button
              key={t.name}
              type="button"
              onClick={() =>
                navigate(
                  `/search?q=${encodeURIComponent((t.query || t.name).replace(/^#/, ""))}`
                )
              }
              className={cn(
                "group relative min-w-[160px] shrink-0 overflow-hidden px-4 py-3 text-left transition-all duration-300",
                "rounded-[var(--radius-xl)] border border-border/50 bg-card/80 backdrop-blur-xl shadow-sm hover:-translate-y-1 hover:shadow-md hover:border-primary/30"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative z-10">
              <p className="font-semibold text-foreground">{t.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t.mentions} mentions</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                    t.sentiment === "positive" && "bg-success/10 text-success",
                    t.sentiment === "negative" && "bg-destructive/10 text-destructive",
                    t.sentiment === "mixed" && "bg-accent text-accent-foreground"
                  )}
                >
                  {t.sentiment}
                </span>
                {t.trend === "up" ? (
                  <TrendingUp className="size-4 text-success" />
                ) : (
                  <TrendingDown className="size-4 text-destructive" />
                )}
              </div>
              </div>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute -right-2 top-1/2 z-10 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-sm md:flex"
          aria-label="Scroll right"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </PageSection>
  )
}
