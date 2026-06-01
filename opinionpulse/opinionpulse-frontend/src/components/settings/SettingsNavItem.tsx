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
          ? "bg-primary/10 font-medium text-primary"
          : "font-normal text-muted-foreground hover:bg-black/[0.04] hover:text-foreground"
      )}
      aria-current={active ? "true" : undefined}
    >
      <Icon
        className={cn(
          "size-4 shrink-0",
          active ? "text-primary" : "text-muted-foreground"
        )}
        aria-hidden
      />
      <span className="truncate">{label}</span>
    </button>
  )
}
