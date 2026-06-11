import { ArrowRight, Search } from "lucide-react"

type SuggestionsBarProps = {
  suggestions: string[]
  onSuggestionClick: (text: string) => void
}

export function SuggestionsBar({
  suggestions,
  onSuggestionClick,
}: SuggestionsBarProps) {
  if (!suggestions?.length) return null

  return (
    <div className="mt-3 w-full space-y-1.5">
      <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Search size={11} />
        Suggested searches:
      </p>
      {suggestions.map((suggestion, i) => (
        <button
          key={`${suggestion}-${i}`}
          type="button"
          onClick={() => onSuggestionClick(suggestion)}
          className="flex w-full items-center gap-2 rounded-[var(--radius-md)] border border-border bg-card px-3 py-2 text-left text-xs font-medium text-foreground transition-all duration-150 hover:border-primary/30 hover:bg-accent hover:text-accent-foreground"
        >
          <Search size={11} className="shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate">{suggestion}</span>
          <ArrowRight size={11} className="shrink-0 text-muted-foreground" />
        </button>
      ))}
    </div>
  )
}
