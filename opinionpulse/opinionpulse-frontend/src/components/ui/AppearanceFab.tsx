import { Moon, Sun } from "lucide-react"
import { useAppearance } from "@/contexts/AppearanceContext"
import { useResolvedTheme } from "@/hooks/useResolvedTheme"
import { cn } from "@/lib/utils"

type AppearanceFabProps = {
  className?: string
}

/** Fixed corner control — light / dark only (default light for new visitors). */
export function AppearanceFab({ className }: AppearanceFabProps) {
  const { updateAppearance } = useAppearance()
  const resolved = useResolvedTheme()
  const isDark = resolved === "dark"

  function pickTheme(next: "light" | "dark") {
    if ((next === "dark") === isDark) return
    updateAppearance({ theme: next })
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 left-6 z-[100] flex items-center gap-1 rounded-full border p-1 shadow-lg backdrop-blur-md",
        "border-[var(--dash-border)] bg-[var(--dash-surface)]/90",
        "max-sm:bottom-4 max-sm:left-4",
        className
      )}
      role="group"
      aria-label="Appearance"
    >
      <button
        type="button"
        onClick={() => pickTheme("light")}
        aria-pressed={!isDark}
        aria-label="Light appearance"
        title="Light"
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-full transition-all duration-300 ease-in-out",
          !isDark
            ? "bg-[var(--dash-accent)] text-white shadow-[0_0_16px_rgba(47,58,47,0.35)]"
            : "text-[var(--dash-text-faint)] hover:bg-[var(--dash-surface-alt)] hover:text-[var(--dash-text)]"
        )}
      >
        <Sun className="size-4" strokeWidth={2} />
      </button>
      <button
        type="button"
        onClick={() => pickTheme("dark")}
        aria-pressed={isDark}
        aria-label="Dark appearance"
        title="Dark"
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-full transition-all duration-300 ease-in-out",
          isDark
            ? "bg-[var(--dash-text)] text-[var(--dash-bg)] shadow-[0_0_20px_rgba(255,255,255,0.12)]"
            : "text-[var(--dash-text-faint)] hover:bg-[var(--dash-surface-alt)] hover:text-[var(--dash-text)]"
        )}
      >
        <Moon className="size-4" strokeWidth={2} />
      </button>
    </div>
  )
}
