import { useId, useState } from "react"
import { Link } from "react-router-dom"
import { BookOpen, ChevronRight, ExternalLink } from "lucide-react"
import type { SearchResponse } from "@/lib/api/types"
import { extractFactualContext } from "@/lib/compare-analytics"
import { proCard } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type TopicContextAccordionProps = {
  data: SearchResponse | null
  name: string
  loading?: boolean
  defaultOpen?: boolean
}

export function TopicContextAccordion({
  data,
  name,
  loading = false,
  defaultOpen = false,
}: TopicContextAccordionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()
  const context = data ? extractFactualContext(data) : null

  return (
    <div className={cn(proCard, "compare-context-accordion overflow-hidden")}>
      <button
        type="button"
        className="compare-context-trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <ChevronRight
          className={cn(
            "size-4 shrink-0 text-[var(--dash-text-faint)] transition-transform duration-200",
            open && "rotate-90"
          )}
          aria-hidden
        />
        <span className="text-sm font-semibold text-[var(--dash-text)]">About {name}</span>
      </button>

      {open && (
        <div
          id={panelId}
          role="region"
          aria-label={`Topic context for ${name}`}
          className="compare-context-panel"
        >
          {loading ? (
            <TopicContextSkeleton />
          ) : context?.text ? (
            <>
              <p className="compare-section-label m-0">Topic overview</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--dash-text-mid)]">
                {context.text}
              </p>
              {context.wikiUrl && (
                <div className="mt-4 border-t border-[var(--dash-border)] pt-3">
                  <p className="compare-section-label m-0">Source</p>
                  <a
                    href={context.wikiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="compare-wiki-link mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--dash-accent)] hover:underline"
                    title="Reference context provided from Wikipedia"
                    aria-label={`Open ${context.wikiTitle ?? name} on Wikipedia`}
                  >
                    <BookOpen className="size-4 shrink-0" aria-hidden />
                    Wikipedia: {context.wikiTitle ?? name}
                    <ExternalLink className="size-3.5 shrink-0 opacity-70" aria-hidden />
                  </a>
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-[var(--dash-text-mid)]">
              <p>No reference summary is currently available for this topic.</p>
              <Link
                to={`/search?q=${encodeURIComponent(name)}`}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--dash-accent)] hover:underline"
              >
                Open full analysis
                <ExternalLink className="size-3" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TopicContextSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-3 w-24 rounded bg-[var(--dash-border)]" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-[var(--dash-border)]" />
        <div className="h-3 w-full rounded bg-[var(--dash-border)]" />
        <div className="h-3 w-4/5 rounded bg-[var(--dash-border)]" />
      </div>
      <div className="h-3 w-40 rounded bg-[var(--dash-border)]" />
    </div>
  )
}

type TopicContextSectionProps = {
  dataA: SearchResponse | null
  dataB: SearchResponse | null
  nameA: string
  nameB: string
  loading?: boolean
}

/** Full-width stacked factual context panels beneath topic analytics cards. */
export function TopicContextSection({
  dataA,
  dataB,
  nameA,
  nameB,
  loading = false,
}: TopicContextSectionProps) {
  return (
    <section className="space-y-3" aria-label="Topic context">
      <TopicContextAccordion data={dataA} name={nameA} loading={loading} />
      <TopicContextAccordion data={dataB} name={nameB} loading={loading} />
    </section>
  )
}
