import { techStack } from "@/data/landingData"
import { SectionHeader } from "@/components/landing/SectionHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cardSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

export function TechStackSection() {
  return (
    <section id="tech-stack" className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeader
          badge="Tech Stack"
          title="Built with modern tools"
          description="OpinionPulse combines a React frontend with a Python backend and public data APIs — designed for your final-year project architecture."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {techStack.map((item) => {
            const Icon = item.icon
            return (
              <Card
                key={item.name}
                className={cn(cardSurface, "text-center")}
              >
                <CardHeader className="items-center">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 text-blue-400">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-base text-white">{item.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-400">{item.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
