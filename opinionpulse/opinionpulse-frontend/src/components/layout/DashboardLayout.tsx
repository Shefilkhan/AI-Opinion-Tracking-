import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  Activity,
  Bell,
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  Settings,
  User,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { UsageWidget } from "@/components/billing/UsageWidget"
import { Skeleton } from "@/components/ui/Skeleton"
import { cn } from "@/lib/utils"
import { pageShell } from "@/lib/ui-classes"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

type NavItem = {
  label: string
  href: string
  icon: typeof LayoutDashboard
  badge?: string
}

const mainNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Search", href: "/search", icon: Search },
  { label: "Compare", href: "/compare", icon: Activity },
  { label: "Ask Pulse AI", href: "/chat", icon: MessageCircle, badge: "AI" },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Alerts", href: "/alerts", icon: Bell },
]

const accountNav: NavItem[] = [
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "My Account", href: "/account", icon: User },
]

function NavLinkItem({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem
  pathname: string
  onNavigate?: () => void
}) {
  const Icon = item.icon
  const isActive =
    item.href === "/settings"
      ? pathname.startsWith("/settings")
      : pathname === item.href || pathname.startsWith(`${item.href}/`)

  return (
    <Link
      to={item.href}
      onClick={onNavigate}
      className={cn(
        "flex min-h-9 items-center gap-2.5 rounded-[9px] px-3 text-[13.5px] font-medium transition-[background,color] duration-150",
        isActive
          ? "bg-[var(--dash-accent-soft)] text-[var(--dash-accent)]"
          : "text-[var(--dash-text-mid)] hover:bg-[var(--dash-surface-alt)] hover:text-[var(--dash-text)]"
      )}
    >
      <Icon className="size-4 shrink-0" strokeWidth={2} aria-hidden />
      <span className="truncate">{item.label}</span>
      {item.badge && (
        <span className="ml-auto rounded-full bg-[var(--dash-accent-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--dash-accent)]">
          {item.badge}
        </span>
      )}
    </Link>
  )
}

function NavGroup({
  label,
  items,
  pathname,
  onNavigate,
}: {
  label: string
  items: NavItem[]
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <div>
      <p className="mb-1.5 mt-5 px-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--dash-text-faint)] first:mt-2">
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavLinkItem
            key={item.href}
            item={item}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  )
}

type DashboardLayoutProps = {
  title?: string
  subtitle?: string
  children: React.ReactNode
  hidePageHeader?: boolean
  headerAction?: React.ReactNode
  dashShell?: boolean
}

export function DashboardLayout({
  title,
  subtitle,
  children,
  hidePageHeader = false,
  headerAction,
  dashShell = false,
}: DashboardLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const { user, logout } = useAuth()

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  async function handleLogout() {
    await logout()
    navigate("/")
  }

  const sidebar = (
    <>
      <Link
        to="/dashboard"
        className="flex min-h-[60px] items-center gap-2.5 border-b border-[var(--dash-border)] px-4 py-3.5 transition-opacity hover:opacity-80 sm:px-5"
        onClick={() => setMobileOpen(false)}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--dash-accent)] text-white">
          <Activity className="size-4" strokeWidth={2} aria-hidden />
        </span>
        <span className="truncate text-base font-semibold text-[var(--dash-text)]">
          OpinionPulse
        </span>
      </Link>
      <nav className="flex-1 overflow-y-auto p-3" aria-label="Main navigation">
        <NavGroup
          label="Main"
          items={mainNav}
          pathname={location.pathname}
          onNavigate={() => setMobileOpen(false)}
        />
        <NavGroup
          label="Account"
          items={accountNav}
          pathname={location.pathname}
          onNavigate={() => setMobileOpen(false)}
        />
      </nav>
      <div className="border-t border-[var(--dash-border)] p-4">
        <UsageWidget />
        {user ? (
          <Link
            to="/account"
            className="flex items-center gap-2.5 rounded-[10px] p-2 transition-colors duration-150 hover:bg-[var(--dash-surface-alt)]"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--dash-accent)] text-[13px] font-semibold text-white">
              {initials || "?"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-[var(--dash-text)]">
                {user.name}
              </p>
              <p className="truncate text-[11.5px] text-[var(--dash-text-faint)]">
                {user.email}
              </p>
            </div>
            <ChevronDown
              className="size-4 shrink-0 text-[var(--dash-text-faint)]"
              strokeWidth={2}
              aria-hidden
            />
          </Link>
        ) : (
          <div className="flex items-center gap-2.5 p-2" aria-hidden>
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="mt-2 flex w-full min-h-9 items-center gap-2.5 rounded-[9px] px-3 text-[13px] font-medium text-[var(--dash-text-mid)] transition-colors duration-150 hover:bg-[var(--dash-neg-soft)] hover:text-[var(--dash-neg)]"
        >
          <LogOut className="size-4 shrink-0" strokeWidth={2} aria-hidden />
          Log out
        </button>
      </div>
    </>
  )

  const mobileMenuTrigger = (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetTrigger
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-[var(--dash-border)] text-[var(--dash-text)] transition-colors hover:bg-[var(--dash-surface-alt)] md:hidden"
        aria-label="Open navigation menu"
      >
        <Menu className="size-5" strokeWidth={2} aria-hidden />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[min(100vw-1rem,18rem)] border-[var(--dash-border)] bg-[var(--dash-surface)] p-0 sm:w-72"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <div className="flex h-full flex-col">{sidebar}</div>
      </SheetContent>
    </Sheet>
  )

  return (
    <div
      className={cn(
        "flex min-h-screen w-full",
        dashShell ? "dashboard-shell bg-[var(--dash-bg)] text-[var(--dash-text)]" : pageShell
      )}
    >
      <aside
        className={cn(
          "relative z-20 hidden h-screen shrink-0 flex-col border-r border-[var(--dash-border)] bg-[var(--dash-surface)] md:flex md:w-60 lg:w-64"
        )}
      >
        {sidebar}
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {!hidePageHeader && (
          <header className="sticky top-0 z-40 flex min-h-[64px] shrink-0 items-center gap-4 border-b border-[var(--dash-border)] bg-[var(--dash-surface)]/95 px-5 py-3 backdrop-blur-sm sm:px-6 lg:px-10">
            {mobileMenuTrigger}
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-semibold text-[var(--dash-text)] md:text-2xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-0.5 truncate text-sm text-[var(--dash-text-mid)]">
                  {subtitle}
                </p>
              )}
            </div>
            {headerAction && <div className="shrink-0">{headerAction}</div>}
          </header>
        )}
        {hidePageHeader && (
          <div className="sticky top-0 z-40 flex min-h-14 shrink-0 items-center border-b border-[var(--dash-border)] bg-[var(--dash-surface)] px-5 py-2 md:hidden">
            {mobileMenuTrigger}
          </div>
        )}

        <main
          className={cn(
            "relative z-10 min-w-0 flex-1",
            dashShell
              ? "px-5 py-6 sm:px-8 lg:px-10 lg:py-8"
              : "w-full px-5 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10 xl:px-12 2xl:px-14"
          )}
        >
          <div className={dashShell ? "mx-auto w-full max-w-7xl" : "mx-auto w-full max-w-7xl"}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
