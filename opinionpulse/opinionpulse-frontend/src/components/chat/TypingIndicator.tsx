import { Sparkles } from "lucide-react"

export function TypingIndicator() {
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
        <span className="ml-2 text-xs text-muted-foreground">Pulse AI is analyzing...</span>
      </div>
    </div>
  )
}
