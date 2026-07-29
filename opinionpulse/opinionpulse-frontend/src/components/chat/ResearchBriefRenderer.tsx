import { useState, type ReactNode } from "react"
import { BookOpen, ChevronDown, ChevronRight, Search } from "lucide-react"
import type { PulseChatReference, PulseChatStructured } from "@/api/chat"
import { cn } from "@/lib/utils"

type ResearchBriefRendererProps = {
  structured: PulseChatStructured
  references?: PulseChatReference[]
  onCitationClick?: (refId: number) => void
  showInlineReferences?: boolean
  dark?: boolean
}

function renderBoldInline(text: string, dark?: boolean): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/)
    if (bold) {
      return (
        <strong
          key={i}
          className={cn("font-semibold", dark ? "text-white" : "text-foreground")}
        >
          {bold[1]}
        </strong>
      )
    }
    return part ? <span key={i}>{part}</span> : null
  })
}

export function CitationBadge({
  refId,
  references,
  onClick,
  dark = false,
}: {
  refId: number
  references: PulseChatReference[]
  onClick?: (id: number) => void
  dark?: boolean
}) {
  const ref = references.find((r) => r.id === refId)
  return (
    <button
      type="button"
      onClick={() => onClick?.(refId)}
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 align-baseline text-[10px] font-semibold uppercase tracking-wide transition-colors",
        dark
          ? "border border-[#333] bg-[#252525] text-[#bdbdbd] hover:border-[#555] hover:bg-[#2f2f2f] hover:text-white"
          : "border border-primary/25 bg-primary/10 text-primary hover:bg-primary/20"
      )}
      title={ref?.title}
    >
      {ref?.citation_label || `[${refId}]`}
    </button>
  )
}

function EvidenceBadges({
  ids,
  references,
  onCitationClick,
  dark,
}: {
  ids: number[]
  references: PulseChatReference[]
  onCitationClick?: (id: number) => void
  dark?: boolean
}) {
  const shown = ids.slice(0, 2)
  const extra = ids.length - shown.length

  return (
    <div className="flex flex-wrap items-center gap-1">
      {shown.map((id) => (
        <CitationBadge
          key={id}
          refId={id}
          references={references}
          onClick={onCitationClick}
          dark={dark}
        />
      ))}
      {extra > 0 && (
        <button
          type="button"
          onClick={() => onCitationClick?.(ids[2] ?? ids[0])}
          className={cn(
            "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            dark
              ? "text-[#888] hover:text-white"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          +{extra} MORE
        </button>
      )}
    </div>
  )
}

function renderWithCitations(
  text: string,
  references: PulseChatReference[],
  onCitationClick?: (id: number) => void,
  dark?: boolean
): ReactNode[] {
  const parts = text.split(/(\[\d+\])/g)
  return parts.flatMap((part, i) => {
    const match = part.match(/^\[(\d+)\]$/)
    if (match) {
      return [
        <CitationBadge
          key={`cite-${i}`}
          refId={parseInt(match[1], 10)}
          references={references}
          onClick={onCitationClick}
          dark={dark}
        />,
      ]
    }
    if (!part) return []
    return [<span key={`txt-${i}`}>{renderBoldInline(part, dark)}</span>]
  })
}

function ResearchSteps({
  steps,
  dark,
}: {
  steps: string[]
  dark?: boolean
}) {
  const [open, setOpen] = useState(true)

  return (
    <div
      className={cn(
        "rounded-lg border",
        dark ? "border-[#2a2a2a] bg-[#161616]" : "border-border bg-muted/30"
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-medium",
          dark ? "text-[#aaa]" : "text-muted-foreground"
        )}
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className="font-semibold text-[#7eb8ff]">Pro</span>
        <span>·</span>
        <span>{steps.length} steps</span>
      </button>
      {open && (
        <div className="space-y-2 border-t border-[#2a2a2a] px-3 py-2.5">
          {steps.map((step, idx) => (
            <div key={step} className="flex items-start gap-2 text-xs">
              {idx === steps.length - 1 ? (
                <BookOpen size={13} className="mt-0.5 shrink-0 text-[#666]" />
              ) : (
                <Search size={13} className="mt-0.5 shrink-0 text-[#666]" />
              )}
              <span className={dark ? "text-[#bbb]" : "text-muted-foreground"}>
                {step}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function ResearchBriefRenderer({
  structured,
  references = [],
  onCitationClick,
  showInlineReferences = false,
  dark = false,
}: ResearchBriefRendererProps) {
  const steps = structured.steps ?? []
  const aspects = structured.aspects ?? []

  return (
    <div className="space-y-5">
      {steps.length > 0 && <ResearchSteps steps={steps} dark={dark} />}

      <div>
        <h2
          className={cn(
            "font-serif-display text-xl font-semibold leading-snug sm:text-2xl",
            dark ? "text-white" : "text-foreground"
          )}
        >
          {structured.title || "Research Overview"}
        </h2>
        {structured.overview && (
          <p
            className={cn(
              "mt-3 text-sm leading-7 sm:text-[15px]",
              dark ? "text-[#d4d4d4]" : "text-foreground"
            )}
          >
            {renderWithCitations(
              structured.overview,
              references,
              onCitationClick,
              dark
            )}
          </p>
        )}
      </div>

      {aspects.length > 0 && (
        <div>
          <h3
            className={cn(
              "mb-3 font-serif-display text-lg font-semibold",
              dark ? "text-white" : "text-foreground"
            )}
          >
            What research says
          </h3>
          <div
            className={cn(
              "overflow-hidden rounded-lg border",
              dark ? "border-[#2a2a2a]" : "border-border"
            )}
          >
            <table className="w-full border-collapse text-sm">
              <thead className={dark ? "bg-[#1a1a1a]" : "bg-muted/60"}>
                <tr>
                  {["Aspect", "Research summary", "Evidence"].map((col) => (
                    <th
                      key={col}
                      className={cn(
                        "border-b px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider",
                        dark
                          ? "border-[#2a2a2a] text-[#777]"
                          : "border-border text-muted-foreground"
                      )}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {aspects.map((row) => (
                  <tr
                    key={row.aspect}
                    className={cn(
                      "border-b last:border-b-0",
                      dark ? "border-[#222]" : "border-border/70"
                    )}
                  >
                    <td
                      className={cn(
                        "px-3 py-3 align-top font-medium",
                        dark ? "text-white" : "text-foreground"
                      )}
                    >
                      {row.aspect}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-3 align-top leading-relaxed",
                        dark ? "text-[#ccc]" : "text-foreground"
                      )}
                    >
                      {renderWithCitations(
                        row.summary,
                        references,
                        onCitationClick,
                        dark
                      )}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <EvidenceBadges
                        ids={row.evidence_ids ?? []}
                        references={references}
                        onCitationClick={onCitationClick}
                        dark={dark}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showInlineReferences && references.length > 0 && (
        <div
          className={cn(
            "space-y-2 rounded-lg border p-3",
            dark ? "border-[#2a2a2a] bg-[#161616]" : "border-border bg-muted/20"
          )}
        >
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-wide",
              dark ? "text-[#777]" : "text-muted-foreground"
            )}
          >
            References ({references.length})
          </p>
          {references.slice(0, 4).map((ref) => (
            <div
              key={ref.id}
              className={cn(
                "rounded-lg border p-2.5",
                dark ? "border-[#2a2a2a] bg-[#111]" : "border-border/70 bg-background/50"
              )}
            >
              <p className={cn("text-xs font-medium", dark ? "text-white" : "text-foreground")}>
                [{ref.id}] {ref.title}
              </p>
              {ref.supporting_quote && (
                <p className={cn("mt-1 text-[11px] italic", dark ? "text-[#888]" : "text-muted-foreground")}>
                  &ldquo;{ref.supporting_quote.slice(0, 140)}
                  {ref.supporting_quote.length > 140 ? "…" : ""}&rdquo;
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
