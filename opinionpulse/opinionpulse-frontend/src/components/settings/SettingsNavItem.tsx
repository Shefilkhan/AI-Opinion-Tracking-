import type { LucideIcon } from "lucide-react"
import type { SettingsSectionId } from "@/components/settings/settingsNav"
import { navItemActive, navItemInactive } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type SettingsNavItemProps = {
  icon: LucideIcon
  label: string
  section: SettingsSectionId
  active: boolean
  onSelect: (section: SettingsSectionId) => void
  compact?: boolean
}

export function SettingsNavItem({
  icon: Icon,
  label,
  section,
  active,
  onSelect,
  compact = false,
}: SettingsNavItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(section)}
      className={cn(
        "flex w-full min-h-10 cursor-pointer items-center rounded-[var(--radius-md)] pr-3 text-sm font-medium transition-colors duration-150",
        compact ? "shrink-0 gap-2 px-3 text-xs" : "gap-3",
        active ? navItemActive : navItemInactive
      )}
      aria-current={active ? "true" : undefined}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </button>
  )
}
