import { Link } from "react-router-dom"
import { Activity } from "lucide-react"
import { footerLinks } from "@/data/landingData"

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/90 py-12">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 font-semibold text-white">
              <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600">
                <Activity className="size-4 text-white" />
              </span>
              OpinionPulse
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              AI-powered opinion tracking with sentiment analysis and a public opinion
              chatbot — built for research, brands, and student projects.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Product</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-slate-400 transition-colors duration-200 hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Resources</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith("/") ? (
                    <Link
                      to={link.href}
                      className="text-sm text-slate-400 transition-colors duration-200 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-sm text-slate-400 transition-colors duration-200 hover:text-white"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} OpinionPulse. All rights reserved. Student project demo.
        </div>
      </div>
    </footer>
  )
}
