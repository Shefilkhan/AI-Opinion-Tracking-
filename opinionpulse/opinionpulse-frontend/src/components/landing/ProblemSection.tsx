import { problemCards } from "@/data/landingData"
import { SectionHeader } from "@/components/landing/SectionHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cardInteractive } from "@/lib/ui-classes"

export function ProblemSection() {
  return (
    <section className="bg-background py-24 md:py-32">
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
                className={cardInteractive}
              >
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-destructive/5 text-destructive">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-lg text-foreground">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">{card.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
