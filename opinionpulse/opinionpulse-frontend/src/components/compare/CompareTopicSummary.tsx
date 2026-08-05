import { BookOpen, ExternalLink, Scale, Sparkles } from "lucide-react"
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
    wiki: "border-blue-500/20 bg-blue-500/5",
  },
  orange: {
    border: "border-l-orange-500",
    header: "bg-orange-500/5",
    badge: "text-orange-700 dark:text-orange-400",
    wiki: "border-orange-500/20 bg-orange-500/5",
  },
} as const

function resolveWikiUrl(data: SearchResponse): string {
  const url = data.wiki_summary?.url
  if (url?.startsWith("https://")) return url
  return `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(data.query)}`
}

function resolveWikiTitle(data: SearchResponse): string {
  return data.wiki_summary?.title ?? data.query
}

export function CompareTopicSummary({ data, accent }: CompareTopicSummaryProps) {
  const styles = accentStyles[accent]
  const summary = hasTopicSummary(data) ? data.topic_summary : null
  const overview = summary?.overview ?? fallbackTopicOverview(data)

  if (!overview) return null

  const paragraphs = overview.split("\n\n").filter(Boolean)
  const wikiUrl = resolveWikiUrl(data)
  const wikiTitle = resolveWikiTitle(data)
  const isSearchFallback = wikiUrl.includes("Special:Search")

  return (
    <section className={cn(proCard, "overflow-hidden border-l-4", styles.border)}>
      <div className={cn("border-b border-border px-5 py-4", styles.header)}>
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn("text-xs font-semibold uppercase tracking-wide", styles.badge)}>
            Topic Summary
          </p>
          {summary?.ai_generated && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="size-3" />
              Pulse AI
            </span>
          )}
        </div>
        {summary && (
          <p className="mt-2 text-sm text-muted-foreground">
            {summary.total_mentions.toLocaleString()} mentions · {summary.sources_count}{" "}
            sources · {summary.sentiment_tone}
          </p>
        )}
      </div>

      <div className="space-y-4 px-5 py-5">
        <a
          href={wikiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-start gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/40",
            styles.wiki
          )}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background/80">
            <BookOpen className="size-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Wikipedia
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">{wikiTitle}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isSearchFallback
                ? "Browse matching Wikipedia articles for this topic"
                : "Read the full encyclopedia article"}
            </p>
          </div>
          <ExternalLink className="mt-1 size-4 shrink-0 text-muted-foreground" />
        </a>

        {paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 40)} className="text-sm leading-relaxed text-foreground sm:text-[15px]">
            {paragraph}
          </p>
        ))}

        {summary && summary.highlights.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              What people are discussing
            </p>
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
          </div>
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
        Generated from live search data (last 24 hours). Topic summaries use Pulse AI when
        configured; conclusions use deterministic rules on mention volume, sentiment, platforms,
        and keywords.
      </p>
    </section>
  )
}
