import { useState } from "react"
import {
  Bookmark,
  ChevronRight,
  Download,
  ExternalLink,
  LayoutGrid,
  List,
  Quote,
  X,
} from "lucide-react"
import type { PulseChatDataUsed, PulseChatReference } from "@/api/chat"
import { cn } from "@/lib/utils"

type ReferencesPanelProps = {
  query: string
  references: PulseChatReference[]
  dataUsed?: PulseChatDataUsed | null
  highlightId?: number | null
  onClose?: () => void
  onHighlight?: (refId: number) => void
}

function formatMeta(ref: PulseChatReference): string {
  const parts: string[] = []
  if (ref.posted_at) parts.push(String(ref.posted_at).slice(0, 4))
  const comments = ref.engagement?.comments ?? 0
  const likes = ref.engagement?.likes ?? 0
  if (comments > 0) parts.push(`${comments} comments`)
  else if (likes > 0) parts.push(`${likes} likes`)
  if (ref.author && ref.author !== "Unknown") parts.push(ref.author)
  parts.push(ref.platform)
  return parts.join(" · ")
}

function ReferenceCard({
  reference,
  highlighted,
  onHighlight,
}: {
  reference: PulseChatReference
  highlighted: boolean
  onHighlight?: (refId: number) => void
}) {
  const [quotesOpen, setQuotesOpen] = useState(false)

  return (
    <article
      id={`ref-${reference.id}`}
      onMouseEnter={() => onHighlight?.(reference.id)}
      className={cn(
        "border-b px-4 py-4 transition-colors last:border-b-0",
        highlighted ? "bg-[#1a1a1a]" : "hover:bg-[#141414]"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#2a2a2a] text-xs font-semibold text-[#ccc]">
          {reference.id}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-white">{reference.title}</p>

          {reference.key_takeaway && (
            <div className="mt-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#666]">
                Key takeaway
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-[#bbb]">
                {reference.key_takeaway}
              </p>
            </div>
          )}

          {reference.supporting_quote && (
            <button
              type="button"
              onClick={() => setQuotesOpen((v) => !v)}
              className="mt-3 inline-flex items-center gap-1 rounded border border-[#333] bg-[#222] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#aaa] transition-colors hover:border-[#444] hover:text-white"
            >
              <Quote size={10} />
              {quotesOpen ? "Hide quote" : "1 supporting quote"}
              <ChevronRight
                size={10}
                className={cn("transition-transform", quotesOpen && "rotate-90")}
              />
            </button>
          )}

          {quotesOpen && reference.supporting_quote && (
            <p className="mt-2 rounded-lg border border-[#2a2a2a] bg-[#111] px-3 py-2 text-xs italic leading-relaxed text-[#ccc]">
              &ldquo;{reference.supporting_quote}&rdquo;
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-[#666]">{formatMeta(reference)}</span>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                reference.sentiment === "positive" && "bg-emerald-950 text-emerald-400",
                reference.sentiment === "negative" && "bg-red-950 text-red-400",
                reference.sentiment !== "positive" &&
                  reference.sentiment !== "negative" &&
                  "bg-[#222] text-[#888]"
              )}
            >
              {reference.sentiment}
            </span>
            {reference.source_url && (
              <a
                href={reference.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded border border-[#333] bg-[#1a1a1a] px-1.5 py-0.5 text-[10px] font-medium text-[#aaa] hover:text-white"
              >
                Source
                <ExternalLink size={9} />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

export function ReferencesPanel({
  query,
  references,
  dataUsed,
  highlightId,
  onClose,
  onHighlight,
}: ReferencesPanelProps) {
  const resultsCount = dataUsed?.results_count ?? references.length

  return (
    <aside className="flex w-full max-w-[420px] shrink-0 flex-col border-l border-[#222] bg-[#0d0d0d] xl:max-w-[480px]">
      <div className="flex items-start justify-between gap-2 border-b border-[#222] px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs text-[#666]">
            References <span className="text-[#444]">/</span>{" "}
            <span className="text-[#999]">{query}</span>
          </p>
          <div className="mt-2 flex items-center gap-3">
            <p className="text-sm font-medium text-white">
              Results{" "}
              <span className="text-[#888]">
                {resultsCount >= 1000
                  ? `${(resultsCount / 1000).toFixed(1)}K`
                  : resultsCount}
              </span>
            </p>
            <div className="flex items-center gap-1 text-[#555]">
              <button type="button" className="rounded p-1 hover:bg-[#222] hover:text-[#aaa]">
                <Bookmark size={14} />
              </button>
              <button type="button" className="rounded p-1 hover:bg-[#222] hover:text-[#aaa]">
                <Download size={14} />
              </button>
              <button type="button" className="rounded p-1 hover:bg-[#222] hover:text-[#aaa]">
                <List size={14} />
              </button>
              <button type="button" className="rounded p-1 hover:bg-[#222] hover:text-[#aaa]">
                <LayoutGrid size={14} />
              </button>
            </div>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[#666] hover:bg-[#222] hover:text-white"
            aria-label="Close references"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {references.map((item) => (
          <ReferenceCard
            key={item.id}
            reference={item}
            highlighted={highlightId === item.id}
            onHighlight={onHighlight}
          />
        ))}
      </div>
    </aside>
  )
}
