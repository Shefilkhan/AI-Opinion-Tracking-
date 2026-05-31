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
            "rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 transition-all duration-200",
            "hover:border-blue-500/40 hover:bg-blue-950/30 hover:text-blue-200",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          {q}
        </button>
      ))}
    </div>
  )
}
