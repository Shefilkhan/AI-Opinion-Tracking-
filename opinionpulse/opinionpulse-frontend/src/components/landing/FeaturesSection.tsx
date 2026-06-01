import { features } from "@/data/landingData"
import { SectionHeader } from "@/components/landing/SectionHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cardInteractive } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeader
          badge="Features"
          title="Everything you need to understand public opinion"
          description="From data collection to AI-powered Q&A — OpinionPulse covers the full opinion-tracking workflow."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card
                key={feature.title}
                className={cn(cardInteractive, "hover:border-primary/20")}
              >
                <CardHeader className="pb-2">
                  <div className="mb-3 flex size-9 items-center justify-center rounded-md bg-primary/5 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <CardTitle className="text-base text-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
