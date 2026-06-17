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
    if ((next === "dark") === isDark) return
    updateAppearance({ theme: next })
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border p-0.5",
        "border-[var(--le-border,var(--dash-border))] bg-[var(--le-surface,var(--dash-surface))]/90",
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
          "inline-flex size-8 items-center justify-center rounded-full transition-all duration-300 ease-in-out",
          !isDark
            ? "bg-[var(--le-forest,var(--dash-accent))] text-white"
            : "text-[var(--le-muted,var(--dash-text-faint))]"
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
          "inline-flex size-8 items-center justify-center rounded-full transition-all duration-300 ease-in-out",
          isDark
            ? "bg-[var(--le-text,var(--dash-text))] text-[var(--le-bg,var(--dash-bg))]"
            : "text-[var(--le-muted,var(--dash-text-faint))]"
        )}
      >
        <Moon className="size-4" />
      </button>
    </div>
  )
}
