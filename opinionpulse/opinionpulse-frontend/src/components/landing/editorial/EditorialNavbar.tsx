import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Activity, Menu } from "lucide-react"
import { editorialNavLinks } from "@/data/landingEditorialData"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { cn } from "@/lib/utils"

export function EditorialNavbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled && "border-b bg-[var(--le-bg)]/95 backdrop-blur-md"
      )}
    >
      <div className="le-container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-[var(--le-text)]">
          <span className="flex size-8 items-center justify-center rounded-full bg-[var(--le-forest)] text-white">
            <Activity className="size-4" />
          </span>
          OpinionPulse
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {editorialNavLinks.map((link) =>
            link.href.startsWith("/") ? (
              <Link
                key={link.href}
                to={link.href}
                className="text-[0.8125rem] font-medium text-[var(--le-muted)] transition-colors hover:text-[var(--le-text)]"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="text-[0.8125rem] font-medium text-[var(--le-muted)] transition-colors hover:text-[var(--le-text)]"
              >
                {link.label}
              </a>
            )
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Link to="/auth/signin" className="le-btn-outline">
            Login
          </Link>
          <Link to="/explore" className="le-btn-outline">
            Explore
          </Link>
          <Link to="/auth/signup" className="le-btn-solid">
            Get started
          </Link>
        </div>

        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className="inline-flex size-10 items-center justify-center rounded-full border border-[var(--le-border)]"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-sm border-[var(--le-border)] bg-[var(--le-bg)] p-0">
              <SheetHeader className="border-b px-6 py-4">
                <SheetTitle className="flex items-center gap-2 text-left text-[var(--le-text)]">
                  <span className="flex size-8 items-center justify-center rounded-full bg-[var(--le-forest)] text-white">
                    <Activity className="size-4" />
                  </span>
                  OpinionPulse
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4 py-6">
                {editorialNavLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-4 py-3 text-base font-medium text-[var(--le-text)] hover:bg-[var(--le-sage-soft)]"
                  >
                    {link.label}
                  </a>
                ))}
                <div className="mt-4 flex flex-col gap-2 border-t pt-4">
                <Link
                  to="/explore"
                  onClick={() => setOpen(false)}
                  className="le-btn-outline justify-center"
                >
                  Explore
                </Link>
                <Link to="/auth/signin" onClick={() => setOpen(false)} className="le-btn-outline justify-center">
                  Login
                </Link>
                  <Link to="/auth/signup" onClick={() => setOpen(false)} className="le-btn-solid justify-center">
                    Get started
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
