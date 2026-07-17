import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  CreditCard,
  LogOut,
  Monitor,
  Moon,
  Settings,
  Sun,
  User,
} from "lucide-react"
import { useAppearance } from "@/contexts/AppearanceContext"
import { useAuth } from "@/contexts/AuthContext"
import type { ThemeMode } from "@/lib/userSettingsStore"
import { cn } from "@/lib/utils"

type ProfileMenuProps = {
  className?: string
}

function ProfileThemeToggle({ className }: { className?: string }) {
  const { appearance, updateAppearance } = useAppearance()
  const theme = appearance.theme

  const options: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
  ]

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-[var(--dash-border)] bg-[var(--dash-surface-alt)] p-0.5",
        className
      )}
      role="group"
      aria-label="Theme"
    >
      {options.map((option) => {
        const Icon = option.icon
        const active = theme === option.id
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => updateAppearance({ theme: option.id })}
            aria-pressed={active}
            aria-label={option.label}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-full transition-colors",
              active
                ? "bg-[var(--dash-accent)] text-white"
                : "text-[var(--dash-text-faint)] hover:text-[var(--dash-text)]"
            )}
          >
            <Icon className="size-4" strokeWidth={2} />
          </button>
        )
      })}
    </div>
  )
}

export function ProfileMenu({ className }: ProfileMenuProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  useEffect(() => {
    if (!open) return
    function handleClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [open])

  if (!user) return null

  async function handleLogout() {
    setOpen(false)
    await logout()
    navigate("/")
  }

  function close() {
    setOpen(false)
  }

  return (
    <div className={cn("relative", className)} ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--dash-accent)] text-white transition-opacity hover:opacity-90"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open profile menu"
      >
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <span className="text-sm font-semibold">{initials || "?"}</span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-[250] w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-surface)] shadow-[0_16px_48px_rgba(0,0,0,0.18)]"
        >
          <div className="border-b border-[var(--dash-border)] px-4 py-4">
            <p className="truncate text-[15px] font-semibold text-[var(--dash-text)]">
              {user.name}
            </p>
            <p className="mt-0.5 truncate text-[13px] text-[var(--dash-text-faint)]">
              {user.email}
            </p>
            <Link
              to="/account"
              role="menuitem"
              onClick={close}
              className="mt-3 flex h-10 w-full items-center justify-center rounded-full border border-[var(--dash-border)] bg-[var(--dash-surface-alt)] text-[13px] font-medium text-[var(--dash-text)] transition-colors hover:bg-[var(--dash-border)]"
            >
              Set up profile
            </Link>
          </div>

          <div className="py-1.5">
            <Link
              to="/settings"
              role="menuitem"
              onClick={close}
              className="flex min-h-10 items-center gap-3 px-4 text-[14px] text-[var(--dash-text)] transition-colors hover:bg-[var(--dash-surface-alt)]"
            >
              <Settings className="size-4 shrink-0 text-[var(--dash-text-mid)]" strokeWidth={2} />
              Settings
            </Link>

            <div className="flex min-h-10 items-center justify-between gap-3 px-4 py-1">
              <span className="text-[14px] text-[var(--dash-text)]">Theme</span>
              <ProfileThemeToggle />
            </div>

            <Link
              to="/pricing"
              role="menuitem"
              onClick={close}
              className="flex min-h-10 items-center gap-3 px-4 text-[14px] text-[var(--dash-text)] transition-colors hover:bg-[var(--dash-surface-alt)]"
            >
              <CreditCard className="size-4 shrink-0 text-[var(--dash-text-mid)]" strokeWidth={2} />
              Pricing
            </Link>
          </div>

          <div className="border-t border-[var(--dash-border)] py-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => void handleLogout()}
              className="flex min-h-10 w-full items-center gap-3 px-4 text-left text-[14px] text-[var(--dash-text)] transition-colors hover:bg-[var(--dash-surface-alt)]"
            >
              <LogOut className="size-4 shrink-0 text-[var(--dash-text-mid)]" strokeWidth={2} />
              Log out
            </button>
          </div>

          <div className="flex items-center gap-3 border-t border-[var(--dash-border)] px-4 py-3 text-[11px] text-[var(--dash-text-faint)]">
            <Link to="/legal/privacy-policy" onClick={close} className="hover:text-[var(--dash-text)]">
              Privacy
            </Link>
            <Link to="/legal/terms-of-service" onClick={close} className="hover:text-[var(--dash-text)]">
              Terms
            </Link>
            <span className="ml-auto flex items-center gap-1">
              <User className="size-3" aria-hidden />
              OpinionPulse
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
