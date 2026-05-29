import { features } from "@/data/landingData"
import { SectionHeader } from "@/components/landing/SectionHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
                className="border-slate-800/60 bg-slate-900/50 shadow-md hover:border-blue-500/20"
              >
                <CardHeader className="pb-2">
                  <div className="mb-3 flex size-9 items-center justify-center rounded-md bg-blue-500/10 text-blue-400">
                    <Icon className="size-4" />
                  </div>
                  <CardTitle className="text-base text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-400">{feature.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
