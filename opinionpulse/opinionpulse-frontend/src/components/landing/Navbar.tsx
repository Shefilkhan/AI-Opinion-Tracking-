import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Activity, ArrowRight, Menu } from "lucide-react"
import { navLinks } from "@/data/landingData"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300 ease-out",
        scrolled
          ? "border-b border-gray-200 bg-white/95 shadow-[0_1px_8px_rgba(0,0,0,0.06)] backdrop-blur-[12px]"
          : "border-b border-transparent bg-transparent shadow-none"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          to="/"
          className={cn(
            "flex items-center gap-2 text-sm font-semibold transition-colors",
            scrolled ? "text-gray-900" : "text-white"
          )}
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-purple-600 text-white shadow-lg shadow-purple-500/30">
            <Activity className="size-4" />
          </span>
          OpinionPulse
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => {
            const className = cn(
              "text-sm font-medium transition-colors duration-200",
              scrolled
                ? "text-gray-600 hover:text-gray-900"
                : "text-gray-300 hover:text-white"
            )
            return link.href.startsWith("/") ? (
              <Link key={link.href} to={link.href} className={className}>
                {link.label}
              </Link>
            ) : (
              <a key={link.href} href={link.href} className={className}>
                {link.label}
              </a>
            )
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button
            render={<Link to="/auth/signin" />}
            variant="ghost"
            size="sm"
            className={cn(
              "border-0 shadow-none",
              scrolled
                ? "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                : "text-white/90 hover:bg-white/10 hover:text-white"
            )}
          >
            Login
          </Button>
          <Button
            render={<Link to="/auth/signup" />}
            size="sm"
            className="gap-1.5 rounded-xl bg-purple-600 px-5 text-white shadow-lg shadow-purple-500/25 hover:bg-purple-500"
          >
            Get Started
            <ArrowRight className="size-4" />
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className={cn(
              "inline-flex size-10 items-center justify-center rounded-lg border transition-colors lg:hidden",
              scrolled
                ? "border-gray-200 text-gray-900 hover:bg-gray-100"
                : "border-white/20 text-white hover:bg-white/10"
            )}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-sm border-gray-200 bg-white p-0 sm:max-w-md">
            <SheetHeader className="border-b border-gray-100 px-6 py-4">
              <SheetTitle className="flex items-center gap-2 text-left">
                <span className="flex size-8 items-center justify-center rounded-lg bg-purple-600 text-white">
                  <Activity className="size-4" />
                </span>
                OpinionPulse
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4 py-6">
              {navLinks.map((link) =>
                link.href.startsWith("/") ? (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-4 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-purple-50 hover:text-purple-700"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-4 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-purple-50 hover:text-purple-700"
                  >
                    {link.label}
                  </a>
                )
              )}
              <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-6">
                <Button
                  render={<Link to="/auth/signin" onClick={() => setOpen(false)} />}
                  variant="ghost"
                  className="h-11 justify-center text-gray-700"
                >
                  Login
                </Button>
                <Button
                  render={<Link to="/auth/signup" onClick={() => setOpen(false)} />}
                  className="h-11 justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500"
                >
                  Get Started
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
