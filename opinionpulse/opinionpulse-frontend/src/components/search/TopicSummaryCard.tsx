import { BookOpen, MessageSquareQuote, Sparkles } from "lucide-react"
import type { SearchResponse, TopicSummary } from "@/lib/api/types"
import { proCard, sectionTitle } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type TopicSummaryCardProps = {
  data: SearchResponse
}

function toneBadgeClass(tone: string) {
  if (tone.includes("positive")) {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
  }
  if (tone.includes("negative")) {
    return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
  }
  if (tone.includes("neutral")) {
    return "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20"
  }
  return "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20"
}

export function TopicSummaryCard({ data }: TopicSummaryCardProps) {
  const summary: TopicSummary | null | undefined = data.topic_summary
  if (!summary?.overview) return null

  const paragraphs = summary.overview.split("\n\n").filter(Boolean)

  return (
    <section className={cn(proCard, "overflow-hidden border-l-4 border-l-primary")}>
      <div className="border-b border-border bg-primary/5 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Topic Summary
              </p>
              <h2 className={cn(sectionTitle, "mt-1 text-xl sm:text-2xl")}>
                {summary.query}
              </h2>
            </div>
          </div>
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize",
              toneBadgeClass(summary.sentiment_tone)
            )}
          >
            {summary.sentiment_tone}
          </span>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {summary.total_mentions.toLocaleString()} mentions ·{" "}
          {summary.sources_count} sources · auto-generated from live data
        </p>
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
        {paragraphs.map((paragraph, index) => (
          <p
            key={index}
            className={cn(
              "text-sm leading-relaxed sm:text-[15px]",
              index === 0 && data.wiki_summary
                ? "text-foreground/90"
                : "text-foreground"
            )}
          >
            {paragraph}
          </p>
        ))}

        {summary.highlights.length > 0 && (
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <MessageSquareQuote className="size-4 text-primary" />
              What people are discussing
            </h3>
            <ul className="space-y-2.5">
              {summary.highlights.map((item) => (
                <li
                  key={item}
                  className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm leading-relaxed text-foreground"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {summary.top_keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {summary.top_keywords.map((word) => (
              <span
                key={word}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground"
              >
                #{word}
              </span>
            ))}
          </div>
        )}

        {data.wiki_summary?.url && (
          <a
            href={data.wiki_summary.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <BookOpen className="size-4" />
            Read more on Wikipedia
          </a>
        )}
      </div>
    </section>
  )
}
