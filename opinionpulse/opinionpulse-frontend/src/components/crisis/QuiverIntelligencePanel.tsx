import { useMemo, useState } from "react"
import { ChevronDown, ExternalLink, Loader2 } from "lucide-react"
import type { QuiverIntelligenceResponse, QuiverSection } from "@/api/quiver"
import { cn } from "@/lib/utils"

type QuiverIntelligencePanelProps = {
  data: QuiverIntelligenceResponse | undefined
  loading?: boolean
  priceChangePct?: number | null
}

const SECTION_GROUPS: Record<
  string,
  { title: string; ids: string[] }
> = {
  market: {
    title: "Market signals",
    ids: ["etf_holdings", "hedge_funds", "alt_data"],
  },
  corporate: {
    title: "Corporate signals",
    ids: ["insiders", "gov_contracts", "lobbying"],
  },
  government: {
    title: "Government / policy",
    ids: ["congress"],
  },
}

const CRYPTO_SECTIONS = new Set(["etf_holdings", "hedge_funds", "alt_data"])
const STOCK_SECTIONS = new Set([
  "congress",
  "insiders",
  "gov_contracts",
  "lobbying",
  "etf_holdings",
  "hedge_funds",
  "alt_data",
])

function relevantSectionIds(assetType: QuiverIntelligenceResponse["asset_type"]): Set<string> | null {
  if (assetType === "crypto") return CRYPTO_SECTIONS
  if (assetType === "stock") return STOCK_SECTIONS
  return null
}

function sectionSummary(section: QuiverSection): string {
  if (section.records.length > 0) {
    return `${section.records.length} recent signal${section.records.length === 1 ? "" : "s"}`
  }
  if (section.message) return section.message
  return "No recent activity"
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
          <span className="min-w-0">
            <span className="block">{section.label}</span>
            <span className="block text-[11px] font-normal text-[var(--dash-text-faint)]">
              {sectionSummary(section)}
            </span>
          </span>
        </span>
        <ChevronDown className={cn("size-4 shrink-0 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className="quiver-section-body">
          <p className="quiver-section-desc">{section.description}</p>
          {section.records.length === 0 && (
            <p className="quiver-section-empty">{sectionSummary(section)}</p>
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

function ExternalSignalSummary({
  data,
  priceChangePct,
}: {
  data: QuiverIntelligenceResponse
  priceChangePct?: number | null
}) {
  const activeSections = data.sections.filter((s) => s.records.length > 0)
  const overall =
    activeSections.length === 0
      ? "No obvious external catalyst detected"
      : `${activeSections.length} external dataset${activeSections.length === 1 ? "" : "s"} with recent activity`

  return (
    <div className="crisis-external-summary mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <div className="crisis-external-summary-item">
        <p className="crisis-mini-label">Price</p>
        <p className="text-sm font-semibold text-[var(--dash-text)]">
          {priceChangePct != null ? `${priceChangePct > 0 ? "+" : ""}${priceChangePct}%` : "No recent data"}
        </p>
      </div>
      {["etf_holdings", "hedge_funds", "congress"].map((id) => {
        const section = data.sections.find((s) => s.id === id)
        if (!section) return null
        return (
          <div key={id} className="crisis-external-summary-item">
            <p className="crisis-mini-label">{section.label}</p>
            <p className="text-sm font-semibold text-[var(--dash-text)]">{sectionSummary(section)}</p>
          </div>
        )
      })}
      <div className="crisis-external-summary-item sm:col-span-2 lg:col-span-4">
        <p className="crisis-mini-label">Overall</p>
        <p className="text-sm text-[var(--dash-text-mid)]">{overall}</p>
      </div>
    </div>
  )
}

function isSetupNotice(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes("quiver_api_key") ||
    lower.includes(".env.local") ||
    lower.includes("api key not configured")
  )
}

export function QuiverIntelligencePanel({ data, loading, priceChangePct }: QuiverIntelligencePanelProps) {
  const filteredSections = useMemo(() => {
    if (!data) return []
    const allowed = relevantSectionIds(data.asset_type)
    if (!allowed) return []
    return data.sections.filter((s) => allowed.has(s.id))
  }, [data])

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-[var(--dash-border)]">
        <Loader2 className="size-6 animate-spin text-[var(--dash-accent)]" />
      </div>
    )
  }

  if (!data) return null

  if (data.asset_type === "unknown") {
    return (
      <div className="rounded-xl border border-dashed border-[var(--dash-border)] bg-[var(--dash-bg)] px-4 py-6 text-sm text-[var(--dash-text-mid)]">
        External market signals are not available for this topic type.
      </div>
    )
  }

  const grouped = Object.entries(SECTION_GROUPS)
    .map(([key, group]) => ({
      key,
      title: group.title,
      sections: filteredSections.filter((s) => group.ids.includes(s.id)),
    }))
    .filter((g) => g.sections.length > 0)

  return (
    <div className="quiver-panel">
      <div className="quiver-panel-header">
        <div>
          <h4 className="font-semibold text-[var(--dash-text)]">Market & external signals</h4>
          <p className="mt-1 text-xs text-[var(--dash-text-faint)]">
            External financial, policy, and institutional signals that may help explain unusual
            conversation.
          </p>
          {data.ticker && (
            <span className="mt-2 inline-flex rounded-full border border-[var(--dash-border)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--dash-text-faint)]">
              {data.ticker}
            </span>
          )}
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

      {data.message && !isSetupNotice(data.message) && (
        <p className="quiver-panel-notice">{data.message}</p>
      )}

      {data.configured && filteredSections.length > 0 && (
        <ExternalSignalSummary data={{ ...data, sections: filteredSections }} priceChangePct={priceChangePct} />
      )}

      <div className="quiver-sections space-y-4">
        {grouped.map((group) => (
          <div key={group.key}>
            <p className="crisis-mini-label mb-2">{group.title}</p>
            <div className="space-y-2">
              {group.sections.map((section) => (
                <SectionBlock key={section.id} section={section} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredSections.length === 0 && (
        <p className="text-sm text-[var(--dash-text-faint)]">
          No relevant external datasets for this topic.
        </p>
      )}
    </div>
  )
}
