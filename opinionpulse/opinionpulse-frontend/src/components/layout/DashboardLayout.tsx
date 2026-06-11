import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  Activity,
  Bell,
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
import { Skeleton } from "@/components/ui/Skeleton"
import { cn } from "@/lib/utils"
import {
  contentMaxWidth,
  navItemActive,
  navItemInactive,
  pageContent,
  pageShell,
  pageSubtitle,
  pageTitle,
  sidebarSurface,
} from "@/lib/ui-classes"
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
        "flex min-h-10 items-center gap-3 rounded-[var(--radius-md)] pr-3 text-sm font-medium transition-colors duration-150",
        isActive ? navItemActive : navItemInactive
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="truncate">{item.label}</span>
      {item.badge && (
        <span className="ml-auto rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
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
    <div className="space-y-0.5">
      <p className="px-3 pb-1 pt-4 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground first:pt-2">
        {label}
      </p>
      {items.map((item) => (
        <NavLinkItem
          key={item.href}
          item={item}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  )
}

type DashboardLayoutProps = {
  title: string
  subtitle?: string
  children: React.ReactNode
  hidePageHeader?: boolean
  headerAction?: React.ReactNode
}

export function DashboardLayout({
  title,
  subtitle,
  children,
  hidePageHeader = false,
  headerAction,
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
        className="flex min-h-[60px] items-center gap-2.5 border-b border-border px-4 py-3.5 transition-opacity hover:opacity-80 sm:px-5"
        onClick={() => setMobileOpen(false)}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary text-primary-foreground">
          <Activity className="size-4" aria-hidden />
        </span>
        <span className="font-serif-display truncate text-base font-medium tracking-normal text-foreground">
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
      <div className="space-y-2 border-t border-border p-3 sm:p-4">
        {user ? (
          <div className="flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] border border-border bg-card px-3 py-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-accent text-xs font-medium text-accent-foreground">
              {initials || "?"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        ) : (
          <div
            className="flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] border border-border bg-card px-3 py-2.5"
            aria-hidden
          >
            <Skeleton className="size-8 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full min-h-10 items-center gap-2.5 rounded-[var(--radius-md)] px-3 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-destructive/5 hover:text-destructive"
        >
          <LogOut className="size-4 shrink-0" aria-hidden />
          Log out
        </button>
      </div>
    </>
  )

  const mobileMenuTrigger = (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetTrigger
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-border text-foreground transition-colors hover:bg-muted md:hidden"
        aria-label="Open navigation menu"
      >
        <Menu className="size-5" aria-hidden />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[min(100vw-1rem,18rem)] border-border bg-[var(--bg-sidebar)] p-0 sm:w-72"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <div className="flex h-full flex-col">{sidebar}</div>
      </SheetContent>
    </Sheet>
  )

  return (
    <div className={cn("flex min-h-screen w-full", pageShell)}>
      <aside
        className={cn(
          "relative z-20 hidden h-screen shrink-0 flex-col border-r border-border md:flex md:w-60 lg:w-64",
          sidebarSurface
        )}
      >
        {sidebar}
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {!hidePageHeader && (
          <header className="sticky top-0 z-40 flex min-h-[64px] shrink-0 items-center gap-4 border-b border-border bg-background/95 px-5 py-3 backdrop-blur-sm sm:px-6 lg:px-8 xl:px-10">
            {mobileMenuTrigger}
            <div className="min-w-0 flex-1">
              <h1 className={cn(pageTitle, "truncate")}>{title}</h1>
              {subtitle && (
                <p className={cn(pageSubtitle, "mt-0.5 truncate")}>{subtitle}</p>
              )}
            </div>
            {headerAction && <div className="shrink-0">{headerAction}</div>}
          </header>
        )}
        {hidePageHeader && (
          <div className="sticky top-0 z-40 flex min-h-14 shrink-0 items-center border-b border-border bg-background px-5 py-2 md:hidden">
            {mobileMenuTrigger}
          </div>
        )}

        <main className={cn("relative z-10 min-w-0 flex-1", pageContent)}>
          <div className={contentMaxWidth}>{children}</div>
        </main>
      </div>
    </div>
  )
}
