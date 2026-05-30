import { Navbar } from "@/components/landing/Navbar"
import { HeroSection } from "@/components/landing/HeroSection"
import { ProblemSection } from "@/components/landing/ProblemSection"
import { SolutionSection } from "@/components/landing/SolutionSection"
import { FeaturesSection } from "@/components/landing/FeaturesSection"
import { HowItWorksSection } from "@/components/landing/HowItWorksSection"
import { ChatbotPreview } from "@/components/landing/ChatbotPreview"
import { DashboardPreview } from "@/components/landing/DashboardPreview"
import { TechStackSection } from "@/components/landing/TechStackSection"
import { PricingSection } from "@/components/landing/PricingSection"
import { CTASection } from "@/components/landing/CTASection"
import { Footer } from "@/components/landing/Footer"
import { pageMesh } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

export function LandingPage() {
  return (
    <div className={cn("min-h-screen text-foreground", pageMesh)}>
      <Navbar />
      <main>
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <FeaturesSection />
        <HowItWorksSection />
        <ChatbotPreview />
        <DashboardPreview />
        <TechStackSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
