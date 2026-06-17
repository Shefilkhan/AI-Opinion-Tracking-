import { Link } from "react-router-dom"
import { Activity } from "lucide-react"
import { footerLinks } from "@/data/landingData"

const linkClass =
  "text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"

const headingClass =
  "mb-4 text-sm font-semibold uppercase tracking-wider text-foreground"

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-12 text-muted-foreground">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
          <div className="sm:col-span-2 lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-white">
                <Activity className="size-4" />
              </span>
              OpinionPulse
            </Link>
            <p className="mt-4 text-sm leading-relaxed">
              Real-time opinion intelligence platform
            </p>
            <p className="mt-2 text-sm">Built by Shefilkhan Pathan</p>
            <p className="text-sm">Conestoga College · GUNI-SSRIP 2026</p>
          </div>

          <div>
            <h4 className={headingClass}>Product</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className={linkClass}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className={headingClass}>Data Sources</h4>
            <ul className="space-y-2">
              {footerLinks.sources.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className={linkClass}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className={headingClass}>Connect</h4>
            <ul className="space-y-2">
              {footerLinks.connect.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className={linkClass}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className={headingClass}>Project</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {footerLinks.project.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-center text-sm text-muted-foreground sm:text-left">
            © {new Date().getFullYear()} OpinionPulse · Built by Shefilkhan Pathan
            · GUNI-SSRIP 2026
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex size-5 items-center justify-center rounded-md bg-gradient-to-br from-violet-600 to-blue-600">
              <Activity size={12} className="text-primary-foreground" />
            </div>
            <span>Powered by OpinionPulse Technology</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
