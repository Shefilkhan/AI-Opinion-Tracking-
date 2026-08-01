import { useEffect, useRef, useState } from "react"
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
  Radar,
  Search,
  Settings,
  User,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { Skeleton } from "@/components/ui/Skeleton"
import { useUsage } from "@/hooks/useUsage"
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
  { label: "Crisis Radar", href: "/crisis", icon: Radar },
  { label: "Compare", href: "/compare", icon: Activity },
  { label: "Ask Pulse AI", href: "/chat", icon: MessageCircle, badge: "AI" },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Brand Monitor", href: "/alerts", icon: Bell },
]

function NavLinkItem({
  item,
  pathname,
  onNavigate,
  badgeOverride,
}: {
  item: NavItem
  pathname: string
  onNavigate?: () => void
  badgeOverride?: string
}) {
  const Icon = item.icon
  const isActive =
    item.href === "/settings"
      ? pathname.startsWith("/settings")
      : pathname === item.href || pathname.startsWith(`${item.href}/`)
  const badge = badgeOverride ?? item.badge

  return (
    <Link
      to={item.href}
      onClick={onNavigate}
      className={cn(
        "relative flex min-h-10 items-center gap-3 rounded-[var(--dash-radius-sm)] px-4 text-[15px] font-medium transition-[color,background] duration-150",
        isActive
          ? "text-[var(--dash-accent)] before:absolute before:left-0 before:top-1/2 before:h-8 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-[var(--dash-accent)] before:content-['']"
          : "text-[var(--dash-text-mid)] hover:text-[var(--dash-text)]"
      )}
    >
      <Icon className="size-5 shrink-0" strokeWidth={isActive ? 2.25 : 2} aria-hidden />
      <span className="truncate">{item.label}</span>
      {badge && (
        <span className="ml-auto rounded-full bg-[var(--dash-accent-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--dash-accent)]">
          {badge}
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
  getBadgeOverride,
}: {
  label: string
  items: NavItem[]
  pathname: string
  onNavigate?: () => void
  getBadgeOverride?: (item: NavItem) => string | undefined
}) {
  return (
    <div>
      <p className="mb-2 mt-4 px-4 text-xs font-medium text-[var(--dash-text-faint)] first:mt-0">
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavLinkItem
            key={item.href}
            item={item}
            pathname={pathname}
            onNavigate={onNavigate}
            badgeOverride={getBadgeOverride?.(item)}
          />
        ))}
      </div>
    </div>
  )
}

function SidebarProfileMenu({
  user,
  initials,
  onNavigate,
  onLogout,
}: {
  user: { name: string; email: string }
  initials?: string
  onNavigate?: () => void
  onLogout: () => void
}) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  function closeAndNavigate() {
    setOpen(false)
    onNavigate?.()
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2.5 rounded-[10px] p-2 text-left transition-colors duration-150 hover:bg-[var(--dash-surface-alt)]"
        aria-expanded={open}
        aria-haspopup="menu"
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
          className={cn(
            "size-4 shrink-0 text-[var(--dash-text-faint)] transition-transform duration-150",
            open && "rotate-180"
          )}
          strokeWidth={2}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-0 right-0 z-[200] mb-2 overflow-hidden rounded-[12px] border border-[var(--dash-border)] bg-[var(--dash-surface)] py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] ring-1 ring-black/5"
        >
          <Link
            to="/account"
            role="menuitem"
            onClick={closeAndNavigate}
            className="flex min-h-10 items-center gap-2.5 px-3.5 text-[13px] font-medium text-[var(--dash-text)] transition-colors hover:bg-[var(--dash-surface-alt)]"
          >
            <User className="size-4 shrink-0 text-[var(--dash-text-mid)]" strokeWidth={2} aria-hidden />
            My Account
          </Link>
          <Link
            to="/settings"
            role="menuitem"
            onClick={closeAndNavigate}
            className="flex min-h-10 items-center gap-2.5 px-3.5 text-[13px] font-medium text-[var(--dash-text)] transition-colors hover:bg-[var(--dash-surface-alt)]"
          >
            <Settings className="size-4 shrink-0 text-[var(--dash-text-mid)]" strokeWidth={2} aria-hidden />
            Settings
          </Link>
          <div className="my-1 border-t border-[var(--dash-border)]" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onLogout()
            }}
            className="flex min-h-10 w-full items-center gap-2.5 px-3.5 text-left text-[13px] font-medium text-[var(--dash-neg)] transition-colors hover:bg-[var(--dash-neg-soft)]"
          >
            <LogOut className="size-4 shrink-0" strokeWidth={2} aria-hidden />
            Log out
          </button>
        </div>
      )}
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
  toolbarLastUpdated?: string | null
  toolbarIsLive?: boolean
}

export function DashboardLayout({
  title,
  subtitle,
  children,
  hidePageHeader,
  headerAction,
  dashShell = true,
  toolbarLastUpdated,
  toolbarIsLive = true,
}: DashboardLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const hideHeader = hidePageHeader ?? dashShell

  const { user, logout } = useAuth()
  const { usage } = useUsage()
  const pulseAiEnabled = usage?.features?.pulse_ai ?? true

  function navBadgeOverride(item: NavItem): string | undefined {
    if (item.href === "/chat" && usage && !pulseAiEnabled) {
      return "Pro"
    }
    return item.badge
  }

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
        className="flex min-h-[72px] items-center gap-3 border-b border-[var(--dash-border)] px-6 py-4 transition-opacity hover:opacity-90"
        onClick={() => setMobileOpen(false)}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--dash-radius-sm)] bg-[var(--dash-accent)] text-white shadow-sm">
          <Activity className="size-5" strokeWidth={2} aria-hidden />
        </span>
        <span className="truncate font-serif-display text-[20px] font-semibold tracking-[-0.02em] text-[var(--dash-text)]">
          OpinionPulse
        </span>
      </Link>
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        <NavGroup
          label="Main"
          items={mainNav}
          pathname={location.pathname}
          onNavigate={() => setMobileOpen(false)}
          getBadgeOverride={navBadgeOverride}
        />
      </nav>
      <div className="relative z-30 shrink-0 border-t border-[var(--dash-border)] p-4">
        {user ? (
          <SidebarProfileMenu
            user={{ name: user.name, email: user.email }}
            initials={initials}
            onNavigate={() => setMobileOpen(false)}
            onLogout={handleLogout}
          />
        ) : (
          <div className="flex items-center gap-2.5 p-2" aria-hidden>
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        )}
        <div className="mt-3 flex justify-center sm:hidden">
          <ThemeToggle />
        </div>
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
        "flex h-screen w-full overflow-hidden",
        dashShell ? "dashboard-shell bg-[var(--dash-bg)] text-[var(--dash-text)]" : pageShell
      )}
    >
      <aside
        className={cn(
          "relative z-20 hidden h-full shrink-0 flex-col border-r border-[var(--dash-border)] bg-[var(--dash-sidebar-bg)] md:flex md:w-[250px] lg:w-[260px]"
        )}
      >
        <div className="flex h-full min-h-0 flex-col">{sidebar}</div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        {dashShell && (
          <DashboardTopBar
            mobileMenu={mobileMenuTrigger}
            lastUpdated={toolbarLastUpdated}
            isLive={toolbarIsLive}
            pageTitle={title ?? "Overview"}
          />
        )}
        {!hideHeader && !dashShell && (
          <header className="sticky top-0 z-40 flex min-h-[64px] shrink-0 items-center gap-4 border-b border-[var(--dash-border)]/40 bg-[var(--dash-surface)]/60 px-5 py-3 backdrop-blur-md sm:px-6 lg:px-10">
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
        {hideHeader && !dashShell && (
          <div className="sticky top-0 z-40 flex min-h-14 shrink-0 items-center border-b border-[var(--dash-border)]/40 bg-[var(--dash-surface)]/60 px-5 py-2 backdrop-blur-md md:hidden">
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
