import { useState } from "react"
import { Link } from "react-router-dom"
import { Menu, Activity } from "lucide-react"
import { navLinks } from "@/data/landingData"
import { Button } from "@/components/ui/button"
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
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold text-white">
          <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600">
            <Activity className="size-4 text-white" />
          </span>
          OpinionPulse
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-slate-400 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button render={<Link to="/login" />} variant="ghost" size="sm">
            Login
          </Button>
          <Button
            render={<Link to="/signup" />}
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:opacity-90"
          >
            Get Started
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-700 text-slate-300 md:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="right" className="border-slate-800 bg-slate-950">
            <SheetHeader>
              <SheetTitle className="text-white">Menu</SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-slate-300 hover:text-white"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-4 flex flex-col gap-2 border-t border-slate-800 pt-4">
                <Button
                  render={<Link to="/login" onClick={() => setOpen(false)} />}
                  variant="outline"
                >
                  Login
                </Button>
                <Button
                  render={<Link to="/signup" onClick={() => setOpen(false)} />}
                  className="bg-gradient-to-r from-blue-600 to-violet-600 text-white"
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
