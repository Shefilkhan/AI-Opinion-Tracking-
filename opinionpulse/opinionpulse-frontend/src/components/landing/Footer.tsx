import { Link } from "react-router-dom"
import { Activity } from "lucide-react"
import { footerLinks } from "@/data/landingData"

export function Footer() {
  return (
    <footer className="border-t border-border bg-[var(--bg-secondary)] py-16 text-muted-foreground">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Activity className="size-4" />
              </span>
              OpinionPulse
            </Link>
            <p className="mt-4 text-sm leading-relaxed">
              AI-powered public opinion intelligence
            </p>
            <p className="mt-2 text-sm">Built by Shefilkhan Pathan</p>
            <p className="text-sm">Conestoga College · GUNI-SSRIP 2026</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Product</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm transition-colors hover:text-foreground">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Data Sources</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.sources.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm transition-colors hover:text-foreground">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Connect</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.connect.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="text-sm transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-center text-sm sm:flex-row sm:text-left">
          <p>© {new Date().getFullYear()} OpinionPulse. Built for academic research.</p>
          <p className="text-primary">Powered by Claude AI · Anthropic</p>
        </div>
      </div>
    </footer>
  )
}
