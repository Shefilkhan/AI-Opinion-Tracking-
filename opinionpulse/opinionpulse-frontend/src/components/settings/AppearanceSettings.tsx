import { Monitor, Moon, Sun } from "lucide-react"
import { useAppearance } from "@/contexts/AppearanceContext"
import { SettingsPanel } from "@/components/settings/SettingsPanel"
import { ACCENT_PRESETS } from "@/lib/userSettingsStore"
import type { FontSize, ThemeMode } from "@/lib/userSettingsStore"
import { cn } from "@/lib/utils"

const THEMES: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
]

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
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Theme</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {THEMES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => updateAppearance({ theme: id })}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border p-4 text-sm font-medium transition-colors duration-150",
                "hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                appearance.theme === id
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-gray-200 bg-white text-muted-foreground"
              )}
              aria-pressed={appearance.theme === id}
            >
              <Icon className="size-6" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Accent color</h3>
        <div className="flex flex-wrap gap-3">
          {ACCENT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              title={preset.label}
              onClick={() => updateAppearance({ accentColor: preset.value })}
              className={cn(
                "size-10 rounded-full border-2 transition-transform duration-150 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                appearance.accentColor === preset.value
                  ? "border-foreground scale-105"
                  : "border-transparent"
              )}
              style={{ backgroundColor: preset.value }}
              aria-label={`Accent ${preset.label}`}
              aria-pressed={appearance.accentColor === preset.value}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Font size</h3>
        <div className="inline-flex rounded-lg border border-gray-200 p-1">
          {FONT_SIZES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => updateAppearance({ fontSize: id })}
              className={cn(
                "min-h-10 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150",
                "hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500",
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
      </div>
    </SettingsPanel>
  )
}
