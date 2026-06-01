import { useState } from "react"
import { Link } from "react-router-dom"
import { Menu, Activity } from "lucide-react"
import { navLinks } from "@/data/landingData"
import { Button } from "@/components/ui/button"
import { btnPrimary } from "@/lib/ui-classes"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Activity className="size-4" />
          </span>
          OpinionPulse
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button render={<Link to="/auth/signin" />} variant="ghost" size="sm">
            Login
          </Button>
          <Button render={<Link to="/auth/signup" />} size="sm" className={btnPrimary}>
            Get Started
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="inline-flex size-8 items-center justify-center rounded-md border border-gray-200 text-foreground transition-colors hover:bg-muted md:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-4" />
          </SheetTrigger>
          <SheetContent side="right" className="border-gray-200 bg-card">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-4 flex flex-col gap-2 border-t border-gray-200 pt-4">
                <Button
                  render={<Link to="/auth/signin" onClick={() => setOpen(false)} />}
                  variant="outline"
                >
                  Login
                </Button>
                <Button
                  render={<Link to="/auth/signup" onClick={() => setOpen(false)} />}
                  className={btnPrimary}
                >
                  Get Started
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
