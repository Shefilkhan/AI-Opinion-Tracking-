import { Moon, Sun } from "lucide-react"
import { useAppearance } from "@/contexts/AppearanceContext"
import { useResolvedTheme } from "@/hooks/useResolvedTheme"
import { cn } from "@/lib/utils"

type ThemeToggleProps = {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { updateAppearance } = useAppearance()
  const resolved = useResolvedTheme()
  const isDark = resolved === "dark"

  function setTheme(next: "light" | "dark") {
    updateAppearance({ theme: next })
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-muted/60 p-0.5",
        className
      )}
      role="group"
      aria-label="Theme"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        aria-pressed={!isDark}
        aria-label="Light mode"
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-full transition-all duration-200",
          !isDark
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Sun className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        aria-pressed={isDark}
        aria-label="Dark mode"
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-full transition-all duration-200",
          isDark
            ? "bg-primary/20 text-primary shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Moon className="size-4" />
      </button>
    </div>
  )
}
