import { GitBranch } from "lucide-react"
import type { TimelineNode } from "@/api/crisis"
import { platformDisplayName } from "@/lib/api/sentiment"
import { cn } from "@/lib/utils"

const ROLE_LABELS = {
  origin: "Origin",
  spread: "Spread",
  amplification: "Amplified",
}

const ROLE_COLORS = {
  origin: "bg-red-500",
  spread: "bg-[var(--dash-accent)]",
  amplification: "bg-violet-500",
}

type SpreadTimelineProps = {
  timeline: TimelineNode[]
}

export function SpreadTimeline({ timeline }: SpreadTimelineProps) {
  if (timeline.length === 0) {
    return (
      <div className="crisis-empty-state">
        <div className="crisis-empty-icon">
          <GitBranch className="size-5" />
        </div>
        <p className="font-medium text-[var(--dash-text)]">No spread timeline yet</p>
        <p className="mt-1 max-w-xs text-sm text-[var(--dash-text-faint)]">
          After a scan finds posts across platforms, we show where the story started and how it
          moved — e.g. Hacker News → Reddit → Bluesky.
        </p>
      </div>
    )
  }

  return (
    <ol className="relative space-y-0 pl-1">
      {timeline.map((node, index) => (
        <li key={node.id} className={cn("relative pb-5 pl-8", index === timeline.length - 1 && "pb-0")}>
          {index < timeline.length - 1 && (
            <span
              className="absolute left-[0.6875rem] top-6 bottom-0 w-px bg-[var(--dash-border)]"
              aria-hidden
            />
          )}
          <span
            className={cn(
              "absolute left-0 top-1 flex size-[1.375rem] items-center justify-center rounded-full text-[10px] font-bold text-white",
              ROLE_COLORS[node.role]
            )}
          >
            {index + 1}
          </span>
          <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-3.5">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--dash-accent)]">
                {ROLE_LABELS[node.role]}
              </span>
              <span className="text-xs font-medium text-[var(--dash-text)]">
                {platformDisplayName(node.platform)}
              </span>
              {node.minutes_after_origin != null && node.role !== "origin" && (
                <span className="text-[10px] text-[var(--dash-text-faint)]">
                  +{node.minutes_after_origin}m
                </span>
              )}
            </div>
            <p className="text-sm font-medium leading-snug text-[var(--dash-text)]">{node.title}</p>
            <p className="mt-1 line-clamp-2 text-xs text-[var(--dash-text-mid)]">{node.snippet}</p>
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
    </ol>
  )
}
