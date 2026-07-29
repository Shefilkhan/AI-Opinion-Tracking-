import { ArrowRight, Search } from "lucide-react"
import { cn } from "@/lib/utils"

type SuggestionsBarProps = {
  suggestions: string[]
  onSuggestionClick: (text: string) => void
  dark?: boolean
}

export function SuggestionsBar({
  suggestions,
  onSuggestionClick,
  dark = false,
}: SuggestionsBarProps) {
  if (!suggestions?.length) return null

  return (
    <div className="mt-3 w-full space-y-1.5">
      <p
        className={cn(
          "flex items-center gap-1 text-xs font-medium",
          dark ? "text-[#666]" : "text-muted-foreground"
        )}
      >
        <Search size={11} />
        Suggested follow-ups:
      </p>
      {suggestions.map((suggestion, i) => (
        <button
          key={`${suggestion}-${i}`}
          type="button"
          onClick={() => onSuggestionClick(suggestion)}
          className={cn(
            "flex w-full items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-left text-xs font-medium transition-all duration-150",
            dark
              ? "border-[#2a2a2a] bg-[#141414] text-[#ccc] hover:border-[#444] hover:bg-[#1a1a1a] hover:text-white"
              : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Search size={11} className={cn("shrink-0", dark ? "text-[#666]" : "text-muted-foreground")} />
          <span className="flex-1 truncate">{suggestion}</span>
          <ArrowRight size={11} className={cn("shrink-0", dark ? "text-[#666]" : "text-muted-foreground")} />
        </button>
      ))}
    </div>
  )
}
