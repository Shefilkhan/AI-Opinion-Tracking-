import { solutionCards } from "@/data/landingData"
import { SectionHeader } from "@/components/landing/SectionHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cardInteractive } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

export function SolutionSection() {
  return (
    <section className="border-y border-slate-800/50 bg-slate-900/30 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeader
          badge="The Solution"
          title="OpinionPulse turns noise into insight"
          description="One platform to collect public discussions, analyze sentiment, spot trends, and chat with an AI assistant — built for your final-year project and beyond."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {solutionCards.map((card) => {
            const Icon = card.icon
            return (
              <Card
                key={card.title}
                className={cn(cardInteractive, "bg-slate-950/50 hover:border-blue-500/30")}
              >
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600/20 to-violet-600/20 text-blue-400">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-lg text-white">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-slate-400">{card.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
