import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  Activity,
  Bot,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  FolderKanban,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { getCurrentUser, logoutUser } from "@/api/auth"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, active: true },
  { label: "Projects", href: "/projects", icon: FolderKanban, active: true },
  { label: "Mentions", href: "#", icon: MessageSquare, active: false },
  { label: "Chatbot", href: "#", icon: Bot, active: false },
  { label: "Reports", href: "#", icon: FileText, active: false },
  { label: "Settings", href: "#", icon: Settings, active: false },
]

type DashboardLayoutProps = {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function DashboardLayout({ title, subtitle, children }: DashboardLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
  })

  function handleLogout() {
    logoutUser()
    navigate("/")
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-slate-950/80 md:flex md:flex-col">
        <Link to="/dashboard" className="flex items-center gap-2 border-b border-slate-800 px-6 py-5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600">
            <Activity className="size-4 text-white" />
          </span>
          <span className="font-semibold text-white">OpinionPulse</span>
        </Link>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.active && location.pathname.startsWith(item.href)
            return item.active ? (
              <Link
                key={item.label}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-blue-600/20 text-blue-300"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            ) : (
              <span
                key={item.label}
                className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600"
                title="Coming soon"
              >
                <Icon className="size-4" />
                {item.label}
              </span>
            )
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-4 py-4 md:px-8">
          <div>
            <h1 className="text-xl font-bold text-white md:text-2xl">{title}</h1>
            {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden text-sm text-slate-400 sm:inline">{user.email}</span>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="size-4" />
              Logout
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
