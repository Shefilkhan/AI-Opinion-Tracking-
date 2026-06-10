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
          ? "border-b border-border bg-background"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-semibold text-foreground transition-colors"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
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
          <Button
            render={<Link to="/auth/signin" />}
            variant="ghost"
            size="sm"
            className="border-0 text-muted-foreground shadow-none hover:bg-muted/60 hover:text-foreground"
          >
            Login
          </Button>
          <Button
            render={<Link to="/auth/signup" />}
            size="sm"
            className="gap-1.5 rounded-xl bg-primary px-5 text-primary-foreground hover:bg-primary/90"
          >
            Get Started
            <ArrowRight className="size-4" />
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="inline-flex size-10 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-muted/60 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-sm border-border bg-background p-0 sm:max-w-md">
            <SheetHeader className="border-b border-border px-6 py-4">
              <SheetTitle className="flex items-center gap-2 text-left">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
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
                    className="rounded-lg px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted/60"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted/60"
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
                <Button
                  render={<Link to="/auth/signup" onClick={() => setOpen(false)} />}
                  className="h-11 justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90"
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
