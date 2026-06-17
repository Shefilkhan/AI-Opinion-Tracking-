import "@/styles/landing-editorial.css"
import { EditorialNavbar } from "@/components/landing/editorial/EditorialNavbar"
import { EditorialHero } from "@/components/landing/editorial/EditorialHero"
import { EditorialFeatures } from "@/components/landing/editorial/EditorialFeatures"
import { EditorialBigPicture } from "@/components/landing/editorial/EditorialBigPicture"
import { EditorialComparison } from "@/components/landing/editorial/EditorialComparison"
import { EditorialQuote } from "@/components/landing/editorial/EditorialQuote"
import { EditorialSteps } from "@/components/landing/editorial/EditorialSteps"
import { EditorialFooter } from "@/components/landing/editorial/EditorialFooter"

export function LandingPage() {
  return (
    <div className="landing-editorial min-h-screen">
      <EditorialNavbar />
      <main>
        <EditorialHero />
        <EditorialFeatures />
        <EditorialBigPicture />
        <EditorialComparison />
        <EditorialQuote />
        <EditorialSteps />
      </main>
      <EditorialFooter />
    </div>
  )
}
