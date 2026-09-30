import { Monitor, Moon, Sun } from "lucide-react"
import { useAppearance } from "@/contexts/AppearanceContext"
import type { ThemeMode } from "@/lib/userSettingsStore"
import { cn } from "@/lib/utils"

type ThemeModeToggleProps = {
  className?: string
  /** Use chat surface tokens when rendered inside Pulse AI */
  variant?: "app" | "chat"
}

const OPTIONS: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light mode", icon: Sun },
  { id: "dark", label: "Dark mode", icon: Moon },
  { id: "system", label: "System theme", icon: Monitor },
]

export function ThemeModeToggle({ className, variant = "app" }: ThemeModeToggleProps) {
  const { appearance, updateAppearance } = useAppearance()
  const theme = appearance.theme

  const shell =
    variant === "chat"
      ? "border-[var(--chat-border)] bg-[var(--chat-surface-2)]"
      : "border-[var(--dash-border)] bg-[var(--dash-surface-alt)]"

  const active =
    variant === "chat"
      ? "bg-[var(--chat-primary)] text-white"
      : "bg-[var(--dash-accent)] text-white"

  const idle =
    variant === "chat"
      ? "text-[var(--chat-text-muted)] hover:text-[var(--chat-text)]"
      : "text-[var(--dash-text-faint)] hover:text-[var(--dash-text)]"

  return (
    <div
      className={cn("inline-flex items-center gap-0.5 rounded-full border p-0.5", shell, className)}
      role="group"
      aria-label="Theme"
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon
        const isActive = theme === option.id
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => updateAppearance({ theme: option.id })}
            aria-pressed={isActive}
            aria-label={option.label}
            title={option.label}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-full transition-colors",
              isActive ? active : idle
            )}
          >
            <Icon className="size-4" strokeWidth={2} />
          </button>
        )
      })}
    </div>
  )
}
