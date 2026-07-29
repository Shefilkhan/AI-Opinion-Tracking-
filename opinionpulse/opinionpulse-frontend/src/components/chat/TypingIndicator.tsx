import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export function TypingIndicator({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex gap-3">
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full border",
          dark
            ? "border-[#333] bg-[#1a1a1a] text-[#7eb8ff]"
            : "border-border bg-accent text-accent-foreground"
        )}
      >
        <Sparkles size={12} aria-hidden />
      </div>
      <div
        className={cn(
          "flex items-center gap-1 rounded-[var(--radius-lg)] rounded-tl-[var(--radius-sm)] border px-3.5 py-2.5",
          dark ? "border-[#2a2a2a] bg-[#141414]" : "border-border bg-card"
        )}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              "inline-block size-2 animate-bounce rounded-full",
              dark ? "bg-[#666]" : "bg-muted-foreground"
            )}
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
        <span className={cn("ml-2 text-xs", dark ? "text-[#888]" : "text-muted-foreground")}>
          Searching live sources...
        </span>
      </div>
    </div>
  )
}
