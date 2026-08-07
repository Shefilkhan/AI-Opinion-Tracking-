import { BookOpen, Scale } from "lucide-react"
import type { SearchResponse } from "@/lib/api/types"
import { proCard, sectionTitle } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"
import {
  buildCompareConclusion,
  fallbackTopicOverview,
  hasTopicSummary,
} from "@/lib/compareConclusion"

type CompareTopicSummaryProps = {
  data: SearchResponse
  accent: "blue" | "orange"
}

const accentStyles = {
  blue: {
    border: "border-l-blue-500",
    header: "bg-blue-500/5",
    badge: "text-blue-700 dark:text-blue-400",
  },
  orange: {
    border: "border-l-orange-500",
    header: "bg-orange-500/5",
    badge: "text-orange-700 dark:text-orange-400",
  },
} as const

function wikiUrl(data: SearchResponse): string | null {
  const url = data.wiki_summary?.url
  if (!url || !url.startsWith("https://")) return null
  return url
}

export function CompareTopicSummary({ data, accent }: CompareTopicSummaryProps) {
  const styles = accentStyles[accent]
  const summary = hasTopicSummary(data) ? data.topic_summary : null
  const overview = summary?.overview ?? fallbackTopicOverview(data)

  if (!overview) return null

  const paragraphs = overview.split("\n\n").filter(Boolean)

  return (
    <section className={cn(proCard, "overflow-hidden border-l-4", styles.border)}>
      <div className={cn("border-b border-border px-5 py-4", styles.header)}>
        <p className={cn("text-xs font-semibold uppercase tracking-wide", styles.badge)}>
          Topic Summary
        </p>
        {summary && (
          <p className="mt-2 text-sm text-muted-foreground">
            {summary.total_mentions.toLocaleString()} mentions · {summary.sources_count}{" "}
            sources · {summary.sentiment_tone}
          </p>
        )}
      </div>

      <div className="space-y-4 px-5 py-5">
        {paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 40)} className="text-sm leading-relaxed text-foreground">
            {paragraph}
          </p>
        ))}

        {summary && summary.highlights.length > 0 && (
          <ul className="space-y-2">
            {summary.highlights.slice(0, 3).map((item) => (
              <li
                key={item}
                className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        )}

        {wikiUrl(data) && (
          <a
            href={wikiUrl(data)!}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <BookOpen className="size-4" />
            Wikipedia: {data.wiki_summary?.title ?? data.query}
          </a>
        )}
      </div>
    </section>
  )
}

type CompareConclusionCardProps = {
  dataA: SearchResponse
  dataB: SearchResponse
}

export function CompareConclusionCard({ dataA, dataB }: CompareConclusionCardProps) {
  const conclusion = buildCompareConclusion(dataA, dataB)

  return (
    <section className={cn(proCard, "border-l-4 border-l-primary p-6 sm:p-8")}>
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Scale className="size-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Comparison Conclusion
          </p>
          <h2 className={cn(sectionTitle, "mt-1 text-xl sm:text-2xl")}>
            {conclusion.headline}
          </h2>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {conclusion.paragraphs.map((paragraph) => (
          <p
            key={paragraph.slice(0, 48)}
            className="text-sm leading-relaxed text-foreground sm:text-[15px]"
          >
            {paragraph}
          </p>
        ))}
      </div>

      <p className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
        Generated from live search data (last 24 hours). Conclusions use deterministic rules on
        mention volume, sentiment, platforms, and keywords — no external AI calls.
      </p>
    </section>
  )
}
