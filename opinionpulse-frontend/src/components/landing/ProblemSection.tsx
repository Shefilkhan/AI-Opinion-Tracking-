import { problemCards } from "@/data/landingData"
import { SectionHeader } from "@/components/landing/SectionHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ProblemSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeader
          badge="The Problem"
          title="Public opinion is everywhere — but hard to understand"
          description="Brands, researchers, students, and businesses struggle to manually read thousands of comments scattered across social platforms and news."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {problemCards.map((card) => {
            const Icon = card.icon
            return (
              <Card
                key={card.title}
                className="border-slate-800/60 bg-slate-900/50 shadow-lg transition-colors hover:border-slate-700"
              >
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
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
