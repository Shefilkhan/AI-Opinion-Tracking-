import { Link } from "react-router-dom"
import { ArrowRight, Play } from "lucide-react"
import { heroPreviewStats } from "@/data/landingData"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { btnPrimary, cardSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

export function HeroSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 md:grid-cols-2 md:px-6">
        <div>
          <Badge variant="secondary" className="mb-4">
            AI-Powered Opinion Tracking
          </Badge>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Track Public Opinion Across Reddit, YouTube, and News
          </h1>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground md:text-lg">
            OpinionPulse collects online discussions, analyzes sentiment, detects
            trends, and answers your questions using an AI-powered opinion assistant.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              render={<Link to="/auth/signup" />}
              size="lg"
              className={cn("gap-2", btnPrimary)}
            >
              Start Tracking
              <ArrowRight className="size-4" />
            </Button>
            <Button render={<a href="#demo" />} variant="outline" size="lg" className="gap-2">
              <Play className="size-4" />
              View Demo
            </Button>
          </div>
        </div>

        <Card className={cardSurface}>
          <CardHeader className="border-b border-gray-200 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Sentiment Overview</CardTitle>
              <span className="text-xs text-muted-foreground">Live preview</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border border-gray-200 bg-card p-3">
                <p className="text-2xl font-semibold text-foreground">12.4K</p>
                <p className="text-xs text-muted-foreground">Mentions</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-card p-3">
                <p className="text-2xl font-semibold text-success">42%</p>
                <p className="text-xs text-muted-foreground">Positive</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-card p-3">
                <p className="text-2xl font-semibold text-destructive">31%</p>
                <p className="text-xs text-muted-foreground">Negative</p>
              </div>
            </div>
            <div className="space-y-3">
              {heroPreviewStats.map((stat) => (
                <div key={stat.label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">{stat.label}</span>
                    <span className="text-foreground">{stat.value}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full rounded-full", stat.color, stat.widthClass)} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Reddit trending</Badge>
              <Badge variant="secondary">Pricing complaints</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
