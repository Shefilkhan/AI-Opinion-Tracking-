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
import { pageShell, sidebarSurface } from "@/lib/ui-classes"
import { Button } from "@/components/ui/button"
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
        "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-150",
        isActive
          ? "bg-purple-50 font-medium text-purple-700 dark:bg-purple-500/10 dark:text-purple-300"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="truncate">{item.label}</span>
      {item.badge && (
        <span className="ml-auto rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
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
    <div className="space-y-1">
      <p className="px-3 pb-1 pt-3 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
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
}

export function DashboardLayout({
  title,
  subtitle,
  children,
  hidePageHeader = false,
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
        className="flex min-h-11 items-center gap-2 border-b border-gray-200 px-4 py-3 transition-opacity hover:opacity-80 dark:border-[#2d2d44] sm:px-5 sm:py-4"
        onClick={() => setMobileOpen(false)}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Activity className="size-4" aria-hidden />
        </span>
        <span className="truncate text-sm font-semibold tracking-tight text-foreground">
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
      <div className="border-t border-gray-200 p-3 dark:border-white/10 sm:p-4">
        {user ? (
          <div className="flex min-h-11 items-center gap-3 rounded-lg border border-gray-200 bg-card px-3 py-2 shadow-[var(--shadow-subtle)] dark:border-[#2d2d44]">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium text-foreground">
              {initials || "?"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        ) : (
          <div
            className="flex min-h-11 items-center gap-3 rounded-lg border border-gray-200 bg-card px-3 py-2 dark:border-[#2d2d44]"
            aria-hidden
          >
            <Skeleton className="size-8 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        )}
      </div>
    </>
  )

  return (
    <div className={cn("flex min-h-screen flex-col md:flex-row", pageShell)}>
      <aside
        className={cn(
          "relative z-20 hidden w-full shrink-0 flex-col border-b backdrop-blur-sm md:flex md:w-56 md:border-b-0 md:border-r lg:w-60",
          sidebarSurface
        )}
      >
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {!hidePageHeader && (
          <header
            className={cn(
              "sticky top-0 z-40 flex min-h-14 items-center justify-between gap-3 border-b px-4 py-2 backdrop-blur-sm sm:gap-4 sm:px-6 md:min-h-16 md:px-8",
              sidebarSurface
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-md border border-gray-200 text-foreground transition-colors hover:bg-muted dark:border-[#2d2d44] dark:hover:bg-white/5 md:hidden"
                  aria-label="Open navigation menu"
                >
                  <Menu className="size-5" aria-hidden />
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-[min(100vw-1rem,18rem)] border-gray-200 bg-card p-0 dark:border-[#2d2d44] sm:w-72"
                >
                  <SheetHeader className="sr-only">
                    <SheetTitle>Navigation</SheetTitle>
                  </SheetHeader>
                  <div className="flex h-full flex-col">{sidebar}</div>
                </SheetContent>
              </Sheet>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl md:text-2xl">
                  {title}
                </h1>
                {subtitle && (
                  <p className="truncate text-sm font-normal text-muted-foreground">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="h-11 shrink-0 gap-2 border-gray-200 px-3 text-gray-600 hover:bg-red-50 hover:text-red-600 dark:border-[#2d2d44] dark:text-gray-300 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400 sm:px-4 md:h-8"
            >
              <LogOut className="size-4" aria-hidden />
              <span className="hidden sm:inline">Logout</span>
              <span className="sr-only sm:hidden">Logout</span>
            </Button>
          </header>
        )}
        {hidePageHeader && (
          <div
            className={cn(
              "sticky top-0 z-40 flex min-h-14 items-center border-b px-4 py-2 backdrop-blur-sm md:hidden md:px-8",
              sidebarSurface
            )}
          >
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-md border border-gray-200 text-foreground transition-colors hover:bg-muted dark:border-[#2d2d44] dark:hover:bg-white/5"
                aria-label="Open navigation menu"
              >
                <Menu className="size-5" aria-hidden />
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[min(100vw-1rem,18rem)] border-gray-200 bg-card p-0 sm:w-72"
              >
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <div className="flex h-full flex-col">{sidebar}</div>
              </SheetContent>
            </Sheet>
          </div>
        )}

        <main className="relative z-10 flex-1 px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
