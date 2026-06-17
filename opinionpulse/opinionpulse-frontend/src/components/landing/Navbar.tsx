import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Activity, ArrowRight, Menu } from "lucide-react"
import { navLinks } from "@/data/landingData"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
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
          ? "border-b border-border bg-background/90 shadow-sm backdrop-blur-[12px]"
          : "border-b border-transparent bg-background/70 backdrop-blur-sm"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-semibold text-foreground transition-colors"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/25">
            <Activity className="size-4" />
          </span>
          OpinionPulse
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => {
            const className =
              "text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
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
          <ThemeToggle />
          <Button
            render={<Link to="/auth/signin" />}
            variant="ghost"
            size="sm"
            className="border-0 text-foreground shadow-none hover:bg-muted hover:text-foreground"
          >
            Login
          </Button>
          <Link
            to="/auth/signup"
            className="btn-gradient inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold"
          >
            Get Started
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className="inline-flex size-10 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-muted"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-sm border-border bg-background p-0 sm:max-w-md">
              <SheetHeader className="border-b border-border px-6 py-4">
                <SheetTitle className="flex items-center gap-2 text-left">
                  <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-white">
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
                      className="rounded-lg px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      {link.label}
                    </a>
                  )
                )}
                <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6">
                  <Button
                    render={<Link to="/auth/signin" onClick={() => setOpen(false)} />}
                    variant="ghost"
                    className="h-11 justify-center text-foreground"
                  >
                    Login
                  </Button>
                  <Link
                    to="/auth/signup"
                    onClick={() => setOpen(false)}
                    className="btn-gradient flex h-11 items-center justify-center gap-2 text-sm font-semibold"
                  >
                    Get Started
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
