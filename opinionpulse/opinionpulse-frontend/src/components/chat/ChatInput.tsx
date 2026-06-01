import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { inputSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type ChatInputProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder = "Ask about opinions, sentiment, or sources…",
}: ChatInputProps) {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim() || disabled) return
    onSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          "min-w-0 flex-1 rounded-xl px-4 py-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/20",
          inputSurface
        )}
      />
      <Button
        type="submit"
        disabled={disabled || !value.trim()}
        className="shrink-0 gap-2 bg-primary text-primary-foreground px-4"
      >
        <Send className="size-4" />
        <span className="hidden sm:inline">Send</span>
      </Button>
    </form>
  )
}
