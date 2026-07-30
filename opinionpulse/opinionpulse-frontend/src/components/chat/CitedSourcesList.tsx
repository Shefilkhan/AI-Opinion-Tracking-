import type { PulseChatCitedSource } from "@/api/chat"
import { ExternalLink } from "lucide-react"

const PLATFORM_COLORS: Record<string, string> = {
  reddit: "#FF4500",
  youtube: "#FF0000",
  twitter: "#1DA1F2",
  bluesky: "#0085FF",
  news: "#60A5FA",
}

type CitedSourcesListProps = {
  sources: PulseChatCitedSource[]
}

export function CitedSourcesList({ sources }: CitedSourcesListProps) {
  if (!sources.length) return null

  return (
    <div className="mb-3.5">
      <p className="chat-mono mb-2 text-[10px] uppercase tracking-widest text-[var(--chat-text-muted)]">
        Sources Cited
      </p>
      <div className="flex flex-col gap-1.5">
        {sources.map((src) => {
          const platformKey = src.platform?.toLowerCase() ?? ""
          const platformColor = PLATFORM_COLORS[platformKey] ?? "var(--chat-text-muted)"
          const sentiment = src.sentiment?.toLowerCase()

          return (
            <a
              key={src.number}
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="chat-source-link flex items-center gap-2.5 rounded-[10px] border border-[var(--chat-border)] bg-[var(--chat-surface)] px-3.5 py-2.5 no-underline transition-all"
            >
              <span className="chat-mono flex size-[22px] shrink-0 items-center justify-center rounded-md bg-[var(--chat-purple-dim)] text-[10px] font-bold text-[var(--chat-purple)]">
                {src.number}
              </span>
              <span
                className="chat-mono shrink-0 text-[10px] font-bold uppercase tracking-wide"
                style={{ color: platformColor }}
              >
                {src.platform}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--chat-text)]">
                {src.title}
              </span>
              <span
                className={`chat-mono shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                  sentiment === "positive"
                    ? "bg-emerald-500/12 text-[var(--chat-green)]"
                    : sentiment === "negative"
                      ? "bg-red-500/12 text-[var(--chat-red)]"
                      : "bg-white/[0.06] text-[var(--chat-text-muted)]"
                }`}
              >
                {(src.sentiment ?? "NEU").toUpperCase()}
              </span>
              <ExternalLink size={12} className="shrink-0 text-[var(--chat-text-muted)]" />
            </a>
          )
        })}
      </div>
    </div>
  )
}
