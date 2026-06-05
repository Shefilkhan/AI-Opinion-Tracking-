import { Navbar } from "@/components/landing/Navbar"
import { HeroSection } from "@/components/landing/HeroSection"
import { LiveStatsBar } from "@/components/landing/LiveStatsBar"
import { FeaturesSection } from "@/components/landing/FeaturesSection"
import { HowItWorksSection } from "@/components/landing/HowItWorksSection"
import { LiveDemoSection } from "@/components/landing/LiveDemoSection"
import { TechStackSection } from "@/components/landing/TechStackSection"
import { SocialProofSection } from "@/components/landing/SocialProofSection"
import { PricingSection } from "@/components/landing/PricingSection"
import { CTASection } from "@/components/landing/CTASection"
import { Footer } from "@/components/landing/Footer"

export function LandingPage() {
  return (
    <div className="min-h-screen text-foreground">
      <Navbar />
      <main>
        <HeroSection />
        <LiveStatsBar />
        <div
          className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"
          aria-hidden
        />
        <FeaturesSection />
        <HowItWorksSection />
        <LiveDemoSection />
        <TechStackSection />
        <SocialProofSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
