import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { EditorialNavbar } from "@/components/landing/editorial/EditorialNavbar"
import { EditorialFooter } from "@/components/landing/editorial/EditorialFooter"
import "@/styles/landing-editorial.css"

type LegalPageLayoutProps = {
  title: string
  lastUpdated: string
  children: ReactNode
}

export function LegalPageLayout({ title, lastUpdated, children }: LegalPageLayoutProps) {
  return (
    <div className="landing-editorial min-h-screen">
      <EditorialNavbar />
      <main className="le-container py-12 md:py-16">
        <Link
          to="/auth/signup"
          className="le-auth-link mb-8 inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="size-4" />
          Back to sign up
        </Link>

        <article className="mx-auto max-w-3xl">
          <h1 className="le-section-title mb-2">{title}</h1>
          <p className="le-body mb-10 text-sm">Last updated: {lastUpdated}</p>
          <div className="legal-prose">{children}</div>
        </article>
      </main>
      <EditorialFooter />
    </div>
  )
}
