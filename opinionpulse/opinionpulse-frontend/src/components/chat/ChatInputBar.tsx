import { useEffect, useState, type ReactNode } from "react"
import { ArrowUp, Filter, Globe, Layers } from "lucide-react"

type ChatInputBarProps = {
  onSend: (text: string) => void
  isLoading: boolean
  placeholder?: string
}

export function ChatInputBar({
  onSend,
  isLoading,
  placeholder = "Ask a follow up…",
}: ChatInputBarProps) {
  const [value, setValue] = useState("")
  const [liveSourcesOn, setLiveSourcesOn] = useState(true)
  const [deepMode, setDeepMode] = useState(false)

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setValue("")
  }

  useEffect(() => {
    // Reset height when cleared
  }, [value])

  const canSend = value.trim().length > 0 && !isLoading

  return (
    <div className="shrink-0 border-t border-[var(--chat-border)] bg-[var(--chat-surface)] px-6 py-4">
      <div className="chat-input-shell overflow-hidden rounded-2xl border border-[var(--chat-border)] bg-[var(--chat-surface-2)]">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder={placeholder}
          rows={1}
          maxLength={500}
          className="chat-input-field w-full resize-none border-none bg-transparent px-4 py-3.5 text-sm leading-relaxed text-[var(--chat-text)] outline-none placeholder:text-[var(--chat-text-muted)]"
          style={{ minHeight: "48px", maxHeight: "128px" }}
          onInput={(e) => {
            const el = e.currentTarget
            el.style.height = "auto"
            el.style.height = `${Math.min(el.scrollHeight, 128)}px`
          }}
        />

        <div className="flex items-center justify-between border-t border-[var(--chat-border-2)] px-3 py-2">
          <div className="flex gap-1.5">
            <ToolbarButton
              icon={<Globe size={13} />}
              label="Live sources"
              active={liveSourcesOn}
              onClick={() => setLiveSourcesOn((v) => !v)}
            />
            <ToolbarButton
              icon={<Layers size={13} />}
              label="Deep"
              active={deepMode}
              onClick={() => setDeepMode((v) => !v)}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="chat-toolbar-btn flex items-center gap-1.5 rounded-lg border border-[var(--chat-border)] px-3 py-1.5 text-xs text-[var(--chat-text-mid)]"
            >
              <Filter size={12} />
              Filter
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              className={`chat-send-btn flex size-9 items-center justify-center rounded-[10px] border-none transition-all ${
                canSend ? "chat-send-btn-active" : "chat-send-btn-idle"
              }`}
            >
              {isLoading ? (
                <span className="chat-spinner size-3.5 rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <ArrowUp size={16} className="text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      <p className="chat-mono mt-2 text-center text-[10px] tracking-wide text-[var(--chat-text-muted)]">
        Pulse AI reads live data · Not financial advice
      </p>
    </div>
  )
}

function ToolbarButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`chat-toolbar-btn flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all ${
        active
          ? "border-[rgba(139,92,246,0.30)] bg-[var(--chat-purple-dim)] text-[var(--chat-purple)]"
          : "border-[var(--chat-border)] bg-transparent text-[var(--chat-text-mid)]"
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
