import type { LucideIcon } from "lucide-react"
import type { SettingsSectionId } from "@/components/settings/settingsNav"
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
        "flex w-full cursor-pointer items-center rounded-lg text-sm transition-all duration-150 ease-in-out",
        compact ? "shrink-0 gap-2 px-3 py-2 text-xs" : "gap-2.5 px-3.5 py-2.5",
        active
          ? "bg-purple-50 font-medium text-purple-700 dark:bg-purple-500/15 dark:text-purple-300"
          : "font-normal text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
      )}
      aria-current={active ? "true" : undefined}
    >
      <Icon
        className={cn(
          "size-4 shrink-0",
          active
            ? "text-purple-700 dark:text-purple-300"
            : "text-gray-500 dark:text-gray-400"
        )}
        aria-hidden
      />
      <span className="truncate">{label}</span>
    </button>
  )
}
