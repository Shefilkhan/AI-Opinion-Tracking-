import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  Activity,
  Bot,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  FolderKanban,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { getCurrentUser, logoutUser } from "@/api/auth"
import { cn } from "@/lib/utils"
import { pageMesh } from "@/lib/ui-classes"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, active: true },
  { label: "Projects", href: "/projects", icon: FolderKanban, active: true },
  { label: "Mentions", href: "#", icon: MessageSquare, active: false },
  { label: "Chatbot", href: "#", icon: Bot, active: false },
  { label: "Reports", href: "#", icon: FileText, active: false },
  { label: "Settings", href: "#", icon: Settings, active: false },
]

function NavLinkItem({
  item,
  pathname,
  onNavigate,
}: {
  item: (typeof navItems)[0]
  pathname: string
  onNavigate?: () => void
}) {
  const Icon = item.icon
  const isActive =
    item.active &&
    (item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(item.href))

  if (!item.active) {
    return (
      <span
        className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600"
        title="Coming soon"
      >
        <Icon className="size-4 shrink-0 opacity-50" />
        {item.label}
        <span className="ml-auto text-[10px] uppercase tracking-wider text-slate-700">
          Soon
        </span>
      </span>
    )
  }

  return (
    <Link
      to={item.href}
      onClick={onNavigate}
      className={cn(
        "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-gradient-to-r from-blue-600/20 to-violet-600/10 text-blue-200 shadow-inner shadow-blue-950/30"
          : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-gradient-to-b from-blue-500 to-violet-500" />
      )}
      <Icon className={cn("size-4 shrink-0", isActive && "text-blue-400")} />
      {item.label}
    </Link>
  )
}

type DashboardLayoutProps = {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function DashboardLayout({ title, subtitle, children }: DashboardLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
  })

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  function handleLogout() {
    logoutUser()
    navigate("/")
  }

  const sidebar = (
    <>
      <Link
        to="/dashboard"
        className="flex items-center gap-2.5 border-b border-slate-800/80 px-5 py-5 transition-opacity hover:opacity-90"
        onClick={() => setMobileOpen(false)}
      >
        <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 shadow-lg shadow-blue-900/40">
          <Activity className="size-4 text-white" />
        </span>
        <span className="font-semibold tracking-tight text-white">OpinionPulse</span>
      </Link>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {navItems.map((item) => (
          <NavLinkItem
            key={item.label}
            item={item}
            pathname={location.pathname}
            onNavigate={() => setMobileOpen(false)}
          />
        ))}
      </nav>
      {user && (
        <div className="border-t border-slate-800/80 p-4">
          <div className="flex items-center gap-3 rounded-lg bg-slate-900/80 px-3 py-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600/80 to-violet-600/80 text-xs font-semibold text-white">
              {initials || "?"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )

  return (
    <div className={cn("flex min-h-screen", pageMesh)}>
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800/80 bg-slate-950/90 backdrop-blur-xl md:flex">
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-slate-800/80 bg-slate-950/70 px-4 py-3.5 backdrop-blur-xl md:px-8 md:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-700/80 text-slate-300 transition-colors hover:bg-slate-800 md:hidden"
                aria-label="Open navigation"
              >
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-72 border-slate-800 bg-slate-950 p-0"
              >
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <div className="flex h-full flex-col">{sidebar}</div>
              </SheetContent>
            </Sheet>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight text-white md:text-2xl">
                {title}
              </h1>
              {subtitle && (
                <p className="truncate text-sm text-slate-400">{subtitle}</p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="shrink-0 gap-2 border-slate-700/80"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
