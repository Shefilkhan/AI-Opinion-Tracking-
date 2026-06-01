import { SETTINGS_SECTIONS } from "@/components/settings/settingsNav"
import type { SettingsSectionId } from "@/components/settings/settingsNav"
import { cn } from "@/lib/utils"

type SettingsMobileTabsProps = {
  activeSection: SettingsSectionId
  onSelect: (section: SettingsSectionId) => void
}

export function SettingsMobileTabs({
  activeSection,
  onSelect,
}: SettingsMobileTabsProps) {
  return (
    <div
      className="flex overflow-x-auto border-b border-border md:hidden"
      role="tablist"
      aria-label="Settings sections"
    >
      {SETTINGS_SECTIONS.map((item) => {
        const Icon = item.icon
        const active = activeSection === item.id
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(item.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-medium transition-colors duration-150",
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
