import { ArrowRight, MessageSquarePlus } from "lucide-react"
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
    <div className="mt-3 w-full">
      <p
        className={cn(
          "mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide",
          dark ? "text-[#666]" : "text-muted-foreground"
        )}
      >
        <MessageSquarePlus size={11} />
        Follow up
      </p>
      <div className="flex flex-col gap-1.5">
        {suggestions.map((suggestion, i) => (
          <button
            key={`${suggestion}-${i}`}
            type="button"
            onClick={() => onSuggestionClick(suggestion)}
            className={cn(
              "group flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-xs transition-all duration-150",
              dark
                ? "border-[#2a2a2a] bg-[#141414] text-[#ccc] hover:border-[#7eb8ff]/30 hover:bg-[#1a1a1a] hover:text-white"
                : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-accent"
            )}
          >
            <span className="min-w-0 flex-1 leading-snug">{suggestion}</span>
            <ArrowRight
              size={12}
              className={cn(
                "shrink-0 transition-transform group-hover:translate-x-0.5",
                dark ? "text-[#555] group-hover:text-[#7eb8ff]" : "text-muted-foreground"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
