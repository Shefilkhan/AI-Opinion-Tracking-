import { useEffect, useState } from "react"
import { Zap } from "lucide-react"

const STAGES = [
  "Searching 13 live sources…",
  "Reading Reddit, YouTube, Bluesky…",
  "Analyzing sentiment patterns…",
  "Generating cited response…",
]

export function AIThinkingIndicator() {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStage((s) => (s + 1) % STAGES.length)
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-start gap-3">
      <div className="chat-ai-avatar chat-ai-avatar-glow flex size-8 shrink-0 items-center justify-center rounded-[10px]">
        <Zap size={14} className="text-white" />
      </div>
      <div className="rounded-2xl rounded-bl-md border border-[var(--chat-border)] bg-[var(--chat-surface)] px-[18px] py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="chat-bounce-dot size-1.5 rounded-full bg-[var(--chat-purple)]"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <span className="chat-mono chat-fade-in text-[11px] tracking-wide text-[var(--chat-text-muted)]">
            {STAGES[stage]}
          </span>
        </div>
      </div>
    </div>
  )
}
