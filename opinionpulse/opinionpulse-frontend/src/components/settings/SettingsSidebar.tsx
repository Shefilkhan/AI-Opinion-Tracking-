import { SETTINGS_NAV_GROUPS } from "@/components/settings/settingsNav"
import { SettingsNavItem } from "@/components/settings/SettingsNavItem"
import type { SettingsSectionId } from "@/components/settings/settingsNav"

type SettingsSidebarProps = {
  activeSection: SettingsSectionId
  onSelect: (section: SettingsSectionId) => void
}

export function SettingsSidebar({ activeSection, onSelect }: SettingsSidebarProps) {
  return (
    <nav className="w-full shrink-0 space-y-1" aria-label="Settings sections">
      {SETTINGS_NAV_GROUPS.map((group) => (
        <div key={group.label} className="space-y-0.5">
          <span className="block px-3.5 pb-1.5 pt-4 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/80">
            {group.label}
          </span>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => (
              <SettingsNavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                section={item.id}
                active={activeSection === item.id}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}
