import { cn } from "@/lib/utils"

const DEFAULT_QUESTIONS = [
  "What are people saying overall?",
  "What are the top complaints?",
  "What do users like?",
  "Compare Reddit and YouTube sentiment.",
  "Is sentiment mostly positive or negative?",
  "What are the strongest negative mentions?",
]

type SuggestedQuestionsProps = {
  onSelect: (question: string) => void
  disabled?: boolean
}

export function SuggestedQuestions({ onSelect, disabled }: SuggestedQuestionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {DEFAULT_QUESTIONS.map((q) => (
        <button
          key={q}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(q)}
          className={cn(
            "rounded-full border border-gray-200 bg-muted px-3 py-1.5 text-xs text-foreground/80 transition-all duration-200",
            "hover:border-primary/30 hover:bg-muted hover:text-foreground",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          {q}
        </button>
      ))}
    </div>
  )
}
