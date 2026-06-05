import { useRef } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from "lucide-react"
import type { TrendingTopic } from "@/api/dashboard"
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
    <section>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-foreground">Trending Right Now</h2>
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-red-500" />
        </span>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Most discussed topics across social media in the last 24 hours
      </p>
      <div className="relative">
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute -left-2 top-1/2 z-10 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm dark:border-[#2d2d44] dark:bg-[#1e1e30] md:flex"
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
              className="min-w-[160px] shrink-0 rounded-[20px] border border-gray-100 bg-white px-4 py-3 text-left transition-all duration-150 hover:scale-[1.02] hover:shadow-md dark:border-[#2d2d44] dark:bg-[#1e1e30] dark:hover:shadow-black/30"
            >
              <p className="font-semibold text-foreground">{t.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t.mentions} mentions</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase",
                    t.sentiment === "positive" && "bg-green-100 text-green-800",
                    t.sentiment === "negative" && "bg-red-100 text-red-800",
                    t.sentiment === "mixed" && "bg-amber-100 text-amber-800"
                  )}
                >
                  {t.sentiment}
                </span>
                {t.trend === "up" ? (
                  <TrendingUp className="size-4 text-green-600" />
                ) : (
                  <TrendingDown className="size-4 text-red-500" />
                )}
              </div>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute -right-2 top-1/2 z-10 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm dark:border-[#2d2d44] dark:bg-[#1e1e30] md:flex"
          aria-label="Scroll right"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </section>
  )
}
