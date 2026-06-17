import {
  Bot,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import {
  demoKeywords,
  demoMentions,
  demoQuery,
  demoSentiment,
  demoSources,
} from "@/data/demoShowcaseData"
import { cn } from "@/lib/utils"

type DemoBrowserMockProps = {
  innerScroll: number
  className?: string
}

const FILTERS = ["All", "Reddit", "YouTube", "News", "24h"] as const

export function DemoBrowserMock({ innerScroll, className }: DemoBrowserMockProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10",
        "dark:border-white/10 dark:bg-[#12121f]/95 dark:shadow-black/40",
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex gap-1.5">
          <div className="size-3 rounded-full bg-red-400" />
          <div className="size-3 rounded-full bg-yellow-400" />
          <div className="size-3 rounded-full bg-green-400" />
        </div>
        <div className="mx-2 flex flex-1 items-center gap-2 rounded-lg border border-border bg-background/80 px-3 py-1.5 dark:border-white/10 dark:bg-black/20">
          <span className="size-2 shrink-0 rounded-full bg-success animate-pulse" />
          <span className="truncate text-xs text-muted-foreground">
            opinionpulse.io/search?q={demoQuery.replace(/ /g, "+")}
          </span>
        </div>
        <span className="hidden rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success sm:inline">
          Live
        </span>
      </div>

      <div className="relative h-[min(520px,58vh)] overflow-hidden bg-background/50 dark:bg-[#0a0a14]/80">
        <div
          className="p-4 transition-transform duration-100 ease-out will-change-transform md:p-6"
          style={{ transform: `translate3d(0, ${-innerScroll}px, 0)` }}
        >
          <form className="mb-4 flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                readOnly
                value={demoQuery}
                className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm text-foreground shadow-sm dark:border-white/10 dark:bg-white/5"
              />
            </div>
            <button
              type="button"
              className="btn-gradient flex h-11 min-w-[88px] items-center justify-center px-4 text-sm font-semibold"
            >
              Search
            </button>
          </form>

          <div className="mb-4 flex flex-wrap gap-2">
            {demoSources.map((s) => (
              <span
                key={s.name}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[10px] font-medium",
                  s.live
                    ? "border-success/30 bg-success/5 text-success"
                    : "border-border text-muted-foreground dark:border-white/10"
                )}
              >
                {s.name} {s.live ? "Live" : "Off"}
              </span>
            ))}
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {FILTERS.map((f, i) => (
              <span
                key={f}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  i === 0
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground dark:border-white/10"
                )}
              >
                {f}
              </span>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Sentiment overview
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-border bg-muted/20 p-3 text-center dark:border-white/10">
                    <div className="text-lg font-bold text-foreground">{demoSentiment.mentions}</div>
                    <div className="text-[10px] text-muted-foreground">Mentions</div>
                  </div>
                  <div className="rounded-lg border border-success/20 bg-success/5 p-3 text-center">
                    <div className="text-lg font-bold text-success">{demoSentiment.positive}%</div>
                    <div className="text-[10px] text-muted-foreground">Positive</div>
                  </div>
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-center">
                    <div className="text-lg font-bold text-destructive">{demoSentiment.negative}%</div>
                    <div className="text-[10px] text-muted-foreground">Negative</div>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {[
                    { label: "Positive", value: demoSentiment.positive, color: "bg-success" },
                    { label: "Neutral", value: demoSentiment.neutral, color: "bg-muted-foreground/50" },
                    { label: "Negative", value: demoSentiment.negative, color: "bg-destructive" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center gap-2">
                      <span className="w-14 text-[10px] text-muted-foreground">{row.label}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted dark:bg-white/10">
                        <div
                          className={cn("h-full rounded-full", row.color)}
                          style={{ width: `${row.value}%` }}
                        />
                      </div>
                      <span className="text-[10px] tabular-nums text-muted-foreground">{row.value}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="size-3.5 text-primary" />
                  Wikipedia
                </div>
                <p className="mt-1 text-sm font-semibold text-foreground">{demoQuery}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Decentralized digital currency without a central bank. Public discourse
                  spikes around ETF flows, regulation, and macro correlation with tech equities.
                </p>
              </div>

              <div className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 dark:border-violet-500/30 dark:from-violet-500/15">
                <div className="mb-2 flex items-center gap-2">
                  <Bot className="size-4 text-primary" />
                  <span className="text-xs font-semibold text-primary">AI Opinion Analysis</span>
                  <span className="text-[10px] text-muted-foreground">Powered by Groq</span>
                </div>
                <p className="text-sm leading-relaxed text-foreground">
                  &ldquo;Bitcoin faces a crisis of confidence as institutional support clashes
                  with retail fear. Optimists cite ETF inflows; skeptics highlight volatility and
                  regulatory headlines.&rdquo;
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Live mentions
                </p>
                {demoMentions.map((m) => (
                  <div
                    key={m.id}
                    className="group flex gap-3 rounded-xl border border-border bg-card p-3 transition-all hover:border-primary/30 hover:shadow-md dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-violet-500/30"
                  >
                    <div
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white",
                        m.platformColor
                      )}
                    >
                      {m.platform.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {m.platform}
                        </span>
                        <span className="text-[10px] text-muted-foreground">· {m.time}</span>
                        {m.sentiment === "positive" && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success">
                            <TrendingUp className="size-2.5" /> Positive
                          </span>
                        )}
                        {m.sentiment === "negative" && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                            <TrendingDown className="size-2.5" /> Negative
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm font-medium text-foreground group-hover:text-primary">
                        {m.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{m.excerpt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 dark:border-white/10 dark:bg-white/[0.03]">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Top keywords
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {demoKeywords.map((k) => (
                  <li
                    key={k.tag}
                    className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 font-medium text-primary dark:border-violet-500/30 dark:bg-violet-500/10"
                    style={{ fontSize: `${0.65 + k.weight * 0.35}rem` }}
                  >
                    {k.tag}
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-lg border border-border bg-muted/20 p-3 dark:border-white/10">
                <p className="text-[10px] font-medium text-muted-foreground">Trend forecast</p>
                <p className="mt-1 text-xs text-foreground">
                  Sentiment momentum <span className="font-semibold text-destructive">↓ 4%</span> over
                  7 days if current news volume holds.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-background to-transparent dark:from-[#0a0a14]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background to-transparent dark:from-[#0a0a14]"
          aria-hidden
        />
      </div>
    </div>
  )
}
