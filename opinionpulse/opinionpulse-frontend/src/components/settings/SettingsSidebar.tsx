import { Link, useLocation } from "react-router-dom"
import { Settings } from "lucide-react"
import { SETTINGS_SECTIONS } from "@/components/settings/settingsNav"
import { cn } from "@/lib/utils"

type SettingsSidebarProps = {
  onNavigate?: () => void
  className?: string
}

export function SettingsSidebar({ onNavigate, className }: SettingsSidebarProps) {
  const { pathname } = useLocation()

  return (
    <nav
      className={cn("flex flex-col gap-1", className)}
      aria-label="Settings sections"
    >
      <div className="mb-3 flex items-center gap-2 px-3 py-2">
        <Settings className="size-4 text-primary" aria-hidden />
        <span className="text-sm font-semibold text-foreground">Settings</span>
      </div>
      {SETTINGS_SECTIONS.map((item) => {
        const Icon = item.icon
        const active = pathname === item.href
        return (
          <Link
            key={item.id}
            to={item.href}
            onClick={onNavigate}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
              "hover:bg-gray-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground"
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
