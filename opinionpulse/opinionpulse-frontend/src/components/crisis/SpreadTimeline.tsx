import { GitBranch } from "lucide-react"
import type { TimelineNode } from "@/api/crisis"
import { platformDisplayName } from "@/lib/api/sentiment"
import { cn } from "@/lib/utils"

const ROLE_LABELS = {
  origin: "First cluster mention detected",
  spread: "Conversation expands",
  amplification: "Negative discussion increases",
}

type SpreadTimelineProps = {
  timeline: TimelineNode[]
  currentStatus?: string
}

function formatTime(postedAt?: string | null): string {
  if (!postedAt) return "—"
  const d = new Date(postedAt)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}

export function SpreadTimeline({ timeline, currentStatus }: SpreadTimelineProps) {
  if (timeline.length === 0) {
    return (
      <div className="crisis-empty-state">
        <div className="crisis-empty-icon">
          <GitBranch className="size-5" />
        </div>
        <p className="font-medium text-[var(--dash-text)]">No spread timeline yet</p>
        <p className="mt-1 max-w-md text-sm text-[var(--dash-text-faint)]">
          After a scan finds posts across platforms, we show where the story started and how it
          moved.
        </p>
      </div>
    )
  }

  return (
    <ol className="crisis-spread-timeline">
      {timeline.map((node, index) => (
        <li key={node.id} className={cn("crisis-spread-node", index === timeline.length - 1 && "is-last")}>
          <div className="crisis-spread-marker" aria-hidden />
          <div className="crisis-spread-content">
            <div className="flex flex-wrap items-center gap-2">
              <span className="crisis-spread-time">{formatTime(node.posted_at)}</span>
              <span className="crisis-spread-platform">{platformDisplayName(node.platform)}</span>
              {node.minutes_after_origin != null && node.role !== "origin" && (
                <span className="text-[10px] text-[var(--dash-text-faint)]">
                  +{node.minutes_after_origin}m
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-medium text-[var(--dash-text)]">
              {ROLE_LABELS[node.role]}
            </p>
            <p className="mt-0.5 text-sm text-[var(--dash-text-mid)]">{node.title}</p>
            <p className="mt-1 line-clamp-2 text-xs text-[var(--dash-text-faint)]">{node.snippet}</p>
            {node.source_url && (
              <a
                href={node.source_url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs font-medium text-[var(--dash-accent)] hover:underline"
              >
                Open post →
              </a>
            )}
          </div>
        </li>
      ))}
      {currentStatus && (
        <li className="crisis-spread-node is-last">
          <div className="crisis-spread-marker crisis-spread-marker-current" aria-hidden />
          <div className="crisis-spread-content">
            <span className="crisis-spread-time">Now</span>
            <p className="mt-1 text-sm font-medium text-[var(--dash-text)]">Current status</p>
            <p className="text-sm text-[var(--dash-accent)]">{currentStatus}</p>
          </div>
        </li>
      )}
    </ol>
  )
}

export function RecentSignalsPanel({ timeline }: { timeline: TimelineNode[] }) {
  const recent = timeline.slice(0, 4)
  if (!recent.length) return null

  return (
    <section className="crisis-subsection">
      <h3 className="crisis-section-label m-0">Recent signals</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {recent.map((node) => (
          <article key={node.id} className="crisis-signal-card">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--dash-text-faint)]">
              {platformDisplayName(node.platform)} · {formatTime(node.posted_at)}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--dash-text-mid)]">
              “{node.snippet.slice(0, 140)}
              {node.snippet.length > 140 ? "…" : ""}”
            </p>
            {node.source_url && (
              <a
                href={node.source_url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs font-medium text-[var(--dash-accent)]"
              >
                View source
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
