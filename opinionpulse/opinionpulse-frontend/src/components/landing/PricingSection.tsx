import { Link } from "react-router-dom"
import { Check } from "lucide-react"
import { pricingPlans } from "@/data/landingData"
import { SectionHeader } from "@/components/landing/SectionHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { btnPrimary, cardInteractive } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

export function PricingSection() {
  return (
    <section id="pricing" className="border-y border-slate-800/50 bg-slate-900/30 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeader
          badge="Pricing"
          title="Simple plans for your project"
          description="Start with a free local demo, showcase your student project, or plan ahead for a future SaaS offering."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {pricingPlans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                "flex flex-col bg-slate-950/50",
                cardInteractive,
                plan.highlighted &&
                  "border-blue-500/40 ring-1 ring-blue-500/30 shadow-blue-900/20"
              )}
            >
              <CardHeader>
                {plan.highlighted && (
                  <span className="mb-2 w-fit rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-300">
                    Recommended
                  </span>
                )}
                <CardTitle className="text-xl text-white">{plan.name}</CardTitle>
                <p className="text-3xl font-bold text-white">{plan.price}</p>
                <p className="text-sm text-slate-400">{plan.description}</p>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check className="size-4 shrink-0 text-emerald-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  render={<Link to="/signup" />}
                  variant={plan.highlighted ? "default" : "outline"}
                  className={cn(
                    "w-full",
                    plan.highlighted && btnPrimary
                  )}
                >
                  Get Started
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
