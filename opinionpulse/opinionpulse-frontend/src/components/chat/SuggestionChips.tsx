import { Plus } from "lucide-react"

type SuggestionChipsProps = {
  suggestions: string[]
  onSelect: (text: string) => void
}

export function SuggestionChips({ suggestions, onSelect }: SuggestionChipsProps) {
  if (!suggestions.length) return null

  return (
    <div className="mt-3">
      <p className="chat-mono mb-2 text-[10px] uppercase tracking-widest text-[var(--chat-text-muted)]">
        Follow-up searches
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSelect(s)}
            className="chat-suggestion-chip flex items-center gap-1.5 rounded-full border border-[var(--chat-border)] bg-[var(--chat-surface)] px-3.5 py-1.5 text-[13px] text-[var(--chat-text-mid)] transition-all"
          >
            <Plus size={12} />
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
