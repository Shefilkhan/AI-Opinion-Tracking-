import { Activity } from "lucide-react"
import type { SentimentSnapshot } from "@/components/chat/types"

type SentimentSnapshotCardProps = {
  data: SentimentSnapshot
}

export function SentimentSnapshotCard({ data }: SentimentSnapshotCardProps) {
  const segments = [
    {
      label: "Positive",
      value: data.positive,
      color: "var(--chat-green)",
      bg: "rgba(52,211,153,0.10)",
    },
    {
      label: "Neutral",
      value: data.neutral,
      color: "var(--chat-text-mid)",
      bg: "rgba(255,255,255,0.05)",
    },
    {
      label: "Negative",
      value: data.negative,
      color: "var(--chat-red)",
      bg: "rgba(248,113,113,0.10)",
    },
  ]

  return (
    <div className="chat-card mb-3 overflow-hidden">
      <div className="chat-card-header">
        <Activity size={14} className="text-[var(--chat-purple)]" />
        <span className="chat-card-label">{data.topic} — Opinion Snapshot</span>
      </div>
      <div className="p-[18px]">
        <div className="mb-4 grid grid-cols-3 gap-3">
          {segments.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border px-2 py-3.5 text-center"
              style={{ background: s.bg, borderColor: `${s.color}30` }}
            >
              <p
                className="chat-serif mb-1 text-[28px] font-bold leading-none"
                style={{ color: s.color }}
              >
                {s.value}%
              </p>
              <p className="chat-mono m-0 text-[10px] tracking-wider text-[var(--chat-text-muted)]">
                {s.label.toUpperCase()}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-3 flex h-2 gap-0.5 overflow-hidden rounded">
          <div
            className="h-full bg-[var(--chat-green)]"
            style={{ width: `${data.positive}%` }}
          />
          <div
            className="h-full bg-white/20"
            style={{ width: `${data.neutral}%` }}
          />
          <div
            className="h-full bg-[var(--chat-red)]"
            style={{ width: `${data.negative}%` }}
          />
        </div>

        {data.dominantPlatform && (
          <p className="chat-mono m-0 text-[11px] text-[var(--chat-text-muted)]">
            Most active on{" "}
            <span className="font-bold text-[var(--chat-purple)]">{data.dominantPlatform}</span>
            {data.trend && (
              <span className={data.trend === "rising" ? "text-[var(--chat-green)]" : "text-[var(--chat-red)]"}>
                {" "}
                · {data.trend === "rising" ? "↑ Rising" : "↓ Falling"}
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  )
}
