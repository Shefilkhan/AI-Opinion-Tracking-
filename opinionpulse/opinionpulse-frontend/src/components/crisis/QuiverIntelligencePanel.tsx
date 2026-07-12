import { useMemo, useState } from "react"
import { ChevronDown, ExternalLink, Loader2 } from "lucide-react"
import type { QuiverIntelligenceResponse, QuiverSection } from "@/api/quiver"
import { cn } from "@/lib/utils"

type QuiverIntelligencePanelProps = {
  data: QuiverIntelligenceResponse | undefined
  loading?: boolean
}

function SectionBlock({ section }: { section: QuiverSection }) {
  const [open, setOpen] = useState(section.records.length > 0)

  return (
    <div className="quiver-section">
      <button
        type="button"
        className="quiver-section-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="quiver-section-title">
          <span aria-hidden>{section.emoji}</span>
          {section.label}
          {section.records.length > 0 && (
            <span className="quiver-section-count">{section.records.length}</span>
          )}
        </span>
        <ChevronDown className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="quiver-section-body">
          <p className="quiver-section-desc">{section.description}</p>
          {section.message && section.records.length === 0 && (
            <p className="quiver-section-empty">{section.message}</p>
          )}
          {section.records.length === 0 && !section.message && (
            <p className="quiver-section-empty">No recent records for this ticker.</p>
          )}
          <ul className="quiver-records">
            {section.records.map((record, idx) => (
              <li key={`${section.id}-${idx}`} className="quiver-record">
                <div className="quiver-record-top">
                  <div className="min-w-0">
                    <p className="quiver-record-title">{record.title}</p>
                    {record.subtitle && (
                      <p className="quiver-record-subtitle">{record.subtitle}</p>
                    )}
                  </div>
                  <div className="quiver-record-meta">
                    {record.amount && <span className="quiver-record-amount">{record.amount}</span>}
                    {record.date && <span className="quiver-record-date">{record.date}</span>}
                  </div>
                </div>
                {record.detail && <p className="quiver-record-detail">{record.detail}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function QuiverIntelligencePanel({ data, loading }: QuiverIntelligencePanelProps) {
  const populatedCount = useMemo(
    () => data?.sections.filter((s) => s.records.length > 0).length ?? 0,
    [data?.sections]
  )

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-[var(--dash-border)]">
        <Loader2 className="size-6 animate-spin text-[var(--dash-accent)]" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="quiver-panel">
      <div className="quiver-panel-header">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-[var(--dash-text)]">Alternative market intelligence</h4>
            {data.ticker && (
              <span className="rounded-full border border-[var(--dash-border)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--dash-text-faint)]">
                {data.ticker}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-[var(--dash-text-faint)]">
            Congressional trades, insiders, lobbying, contracts, 13F moves, and Quiver news — via{" "}
            {data.source}
          </p>
        </div>
        <a
          href="https://www.quiverquant.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="quiver-source-link"
        >
          Quiver Quant
          <ExternalLink className="size-3" />
        </a>
      </div>

      {data.message && (
        <p className="quiver-panel-notice">{data.message}</p>
      )}

      {!data.configured && (
        <p className="quiver-panel-notice quiver-panel-notice-warn">
          Set <code className="text-[11px]">QUIVER_API_KEY</code> in backend{" "}
          <code className="text-[11px]">.env.local</code> to load live datasets.
        </p>
      )}

      {data.configured && populatedCount > 0 && (
        <p className="text-xs text-[var(--dash-text-faint)]">
          {populatedCount} dataset{populatedCount === 1 ? "" : "s"} with recent activity
        </p>
      )}

      <div className="quiver-sections">
        {data.sections.map((section) => (
          <SectionBlock key={section.id} section={section} />
        ))}
      </div>
    </div>
  )
}
