import { Link, useLocation } from "react-router-dom"
import {
  Activity,
  ArrowRight,
  Compass,
  CreditCard,
  Layers3,
  LogIn,
  Sparkles,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { editorialNavLinks } from "@/data/landingEditorialData"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { cn } from "@/lib/utils"

type EditorialMobileMenuProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const NAV_ICONS: Record<string, LucideIcon> = {
  "#features": Sparkles,
  "#steps": Layers3,
  "#pricing": CreditCard,
}

function resolveSectionLink(href: string, pathname: string) {
  if (!href.startsWith("#")) return href
  if (pathname === "/") return href
  return { pathname: "/", hash: href }
}

function isLinkActive(href: string, pathname: string, hash: string) {
  if (href === "#pricing") {
    return pathname.startsWith("/pricing") || hash === "#pricing"
  }
  if (href.startsWith("#")) {
    return hash === href && (pathname === "/" || pathname.startsWith("/pricing"))
  }
  return pathname === href
}

export function EditorialMobileMenu({ open, onOpenChange }: EditorialMobileMenuProps) {
  const location = useLocation()
  const hash = location.hash || ""

  function close() {
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton
        className="le-mobile-menu w-full max-w-[min(100vw,22rem)] border-[var(--le-border)] bg-[var(--le-bg)] p-0 sm:max-w-sm"
      >
        <div className="flex h-full min-h-0 flex-col">
          <SheetHeader className="border-b border-[var(--le-border)] px-5 py-4 text-left">
            <SheetTitle className="flex items-center gap-3 text-[var(--le-text)]">
              <span className="flex size-9 items-center justify-center rounded-full bg-[var(--le-forest)] text-white">
                <Activity className="size-4" />
              </span>
              <span>
                <span className="block text-base font-semibold">OpinionPulse</span>
                <span className="block text-xs font-normal text-[var(--le-muted)]">
                  AI opinion tracking
                </span>
              </span>
            </SheetTitle>
            <SheetDescription className="sr-only">
              Main navigation for OpinionPulse marketing pages
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-5">
            <div className="le-mobile-menu-cta">
              <p className="le-mobile-menu-cta-title">Track every opinion.</p>
              <p className="le-mobile-menu-cta-copy">
                Search 13 live sources, detect debates, and spot crises early.
              </p>
              <Link to="/auth/signup" onClick={close} className="le-mobile-menu-cta-btn">
                Get started free
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <p className="le-mobile-menu-label">Product</p>
            <nav className="le-mobile-menu-nav" aria-label="Product sections">
              {editorialNavLinks.map((link) => {
                const Icon = NAV_ICONS[link.href] ?? Sparkles
                const active = isLinkActive(link.href, location.pathname, hash)
                const to = resolveSectionLink(link.href, location.pathname)

                return link.href.startsWith("#") ? (
                  <Link
                    key={link.href}
                    to={to}
                    onClick={close}
                    className={cn("le-mobile-menu-link", active && "le-mobile-menu-link-active")}
                  >
                    <span className="le-mobile-menu-link-icon">
                      <Icon className="size-4" />
                    </span>
                    <span className="flex-1">{link.label}</span>
                    <ArrowRight className="size-4 opacity-40" />
                  </Link>
                ) : (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={close}
                    className={cn("le-mobile-menu-link", active && "le-mobile-menu-link-active")}
                  >
                    <span className="le-mobile-menu-link-icon">
                      <Icon className="size-4" />
                    </span>
                    <span className="flex-1">{link.label}</span>
                    <ArrowRight className="size-4 opacity-40" />
                  </Link>
                )
              })}

              <Link
                to="/explore"
                onClick={close}
                className={cn(
                  "le-mobile-menu-link",
                  location.pathname.startsWith("/explore") && "le-mobile-menu-link-active"
                )}
              >
                <span className="le-mobile-menu-link-icon">
                  <Compass className="size-4" />
                </span>
                <span className="flex-1">Explore demo</span>
                <ArrowRight className="size-4 opacity-40" />
              </Link>
            </nav>
          </div>

          <SheetFooter className="mt-auto border-t border-[var(--le-border)] px-4 py-4">
            <div className="flex w-full items-center gap-3">
              <Link
                to="/auth/signin"
                onClick={close}
                className="le-mobile-menu-login"
              >
                <LogIn className="size-4" />
                Login
              </Link>
              <ThemeToggle className="ml-auto shrink-0" />
            </div>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
