import { Check, Monitor, Moon, Sun } from "lucide-react"
import { PageSection } from "@/components/layout/PageSection"
import { useAppearance } from "@/contexts/AppearanceContext"
import { SettingsPanel } from "@/components/settings/SettingsPanel"
import { ACCENT_PRESETS } from "@/lib/userSettingsStore"
import type { FontSize, ThemeMode } from "@/lib/userSettingsStore"
import { proCard } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

const THEMES: ThemeMode[] = ["light", "dark", "system"]

const FONT_SIZES: { id: FontSize; label: string }[] = [
  { id: "small", label: "Small" },
  { id: "medium", label: "Medium" },
  { id: "large", label: "Large" },
]

export function AppearanceSettings() {
  const { appearance, updateAppearance } = useAppearance()

  return (
    <SettingsPanel
      title="Appearance"
      description="Customize how OpinionPulse looks. Changes apply immediately."
      showSave={false}
    >
      <PageSection title="Theme" className="mb-0">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {THEMES.map((theme) => (
            <button
              key={theme}
              type="button"
              onClick={() => updateAppearance({ theme })}
              className={cn(
                "relative flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border p-4 transition-colors duration-150",
                appearance.theme === theme
                  ? "border-primary bg-accent/50"
                  : cn(proCard, "bg-muted/20 hover:border-muted-foreground/30")
              )}
              aria-pressed={appearance.theme === theme}
            >
              {appearance.theme === theme && (
                <div className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary">
                  <Check size={11} className="text-primary-foreground" />
                </div>
              )}

              <div
                className={cn(
                  "h-16 w-full overflow-hidden rounded-[var(--radius-md)] border border-border",
                  theme === "dark"
                    ? "bg-gray-900"
                    : theme === "light"
                      ? "bg-white"
                      : "bg-gradient-to-r from-white to-gray-900"
                )}
              >
                <div className="flex h-full">
                  <div
                    className={cn(
                      "h-full w-8",
                      theme === "dark" ? "bg-gray-800" : "bg-muted"
                    )}
                  />
                  <div className="flex-1 space-y-1 p-1.5">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1.5 rounded-full",
                          theme === "dark" ? "bg-gray-700" : "bg-muted",
                          i === 0 ? "w-3/4" : i === 1 ? "w-1/2" : "w-2/3"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {theme === "light" && (
                  <Sun size={14} className="text-primary" aria-hidden />
                )}
                {theme === "dark" && (
                  <Moon size={14} className="text-muted-foreground" aria-hidden />
                )}
                {theme === "system" && (
                  <Monitor size={14} className="text-muted-foreground" aria-hidden />
                )}
                <span
                  className={cn(
                    "text-sm font-medium capitalize",
                    appearance.theme === theme
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {theme}
                </span>
              </div>
            </button>
          ))}
        </div>
      </PageSection>

      <PageSection title="Accent color" className="mb-0">
        <div className="flex flex-wrap gap-3">
          {ACCENT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              title={preset.label}
              onClick={() => updateAppearance({ accentColor: preset.value })}
              className={cn(
                "size-10 rounded-full border-2 transition-transform duration-150 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                appearance.accentColor === preset.value
                  ? "scale-105 border-foreground"
                  : "border-transparent"
              )}
              style={{ backgroundColor: preset.value }}
              aria-label={`Accent ${preset.label}`}
              aria-pressed={appearance.accentColor === preset.value}
            />
          ))}
        </div>
      </PageSection>

      <PageSection title="Font size" className="mb-0">
        <div className="inline-flex rounded-[var(--radius-lg)] border border-border bg-muted/20 p-1">
          {FONT_SIZES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => updateAppearance({ fontSize: id })}
              className={cn(
                "min-h-10 rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium transition-colors duration-150",
                "hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary/20",
                appearance.fontSize === id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              )}
              aria-pressed={appearance.fontSize === id}
            >
              {label}
            </button>
          ))}
        </div>
      </PageSection>
    </SettingsPanel>
  )
}
