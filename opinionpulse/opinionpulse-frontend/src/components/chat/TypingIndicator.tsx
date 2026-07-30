import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export function TypingIndicator({ dark = false }: { dark?: boolean }) {
  if (dark) {
    return (
      <div className="chat-typing-card rounded-xl border border-[#2a2a2a] bg-[#161616] px-4 py-3.5 shadow-sm shadow-black/20">
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#333] bg-[#1a1a1a]">
            <Sparkles size={14} className="text-[#7eb8ff]" aria-hidden />
          </div>
          <div className="flex flex-1 items-center gap-2">
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="inline-block size-1.5 animate-bounce rounded-full bg-[#7eb8ff]"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
            <span className="text-xs text-[#999]">Searching live sources…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-accent text-accent-foreground">
        <Sparkles size={12} aria-hidden />
      </div>
      <div className="flex items-center gap-1 rounded-[var(--radius-lg)] rounded-tl-[var(--radius-sm)] border border-border bg-card px-3.5 py-2.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block size-2 animate-bounce rounded-full bg-muted-foreground"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
        <span className="ml-2 text-xs text-muted-foreground">Searching live sources…</span>
      </div>
    </div>
  )
}
