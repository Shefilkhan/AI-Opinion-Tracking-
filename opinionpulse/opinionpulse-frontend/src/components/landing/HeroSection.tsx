import { Link } from "react-router-dom"
import { ArrowRight, Play } from "lucide-react"
import { heroPreviewStats } from "@/data/landingData"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-violet-900/10" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 md:grid-cols-2 md:px-6">
        <div>
          <Badge className="mb-4 border-blue-500/30 bg-blue-500/10 text-blue-300">
            AI-Powered Opinion Tracking
          </Badge>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
            Track Public Opinion Across Reddit, YouTube, and News
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-400">
            OpinionPulse collects online discussions, analyzes sentiment, detects
            trends, and answers your questions using an AI-powered opinion assistant.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button
              render={<Link to="/signup" />}
              size="lg"
              className="gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:opacity-90"
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

        <Card className="border-slate-800/60 bg-slate-900/70 shadow-2xl shadow-blue-900/10">
          <CardHeader className="border-b border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-white">Sentiment Overview</CardTitle>
              <span className="text-xs text-slate-500">Live preview</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-slate-800/50 p-3">
                <p className="text-2xl font-bold text-white">12.4K</p>
                <p className="text-xs text-slate-500">Mentions</p>
              </div>
              <div className="rounded-lg bg-slate-800/50 p-3">
                <p className="text-2xl font-bold text-emerald-400">42%</p>
                <p className="text-xs text-slate-500">Positive</p>
              </div>
              <div className="rounded-lg bg-slate-800/50 p-3">
                <p className="text-2xl font-bold text-rose-400">31%</p>
                <p className="text-xs text-slate-500">Negative</p>
              </div>
            </div>
            <div className="space-y-3">
              {heroPreviewStats.map((stat) => (
                <div key={stat.label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-slate-400">{stat.label}</span>
                    <span className="text-slate-300">{stat.value}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full ${stat.color}`}
                      style={{ width: `${stat.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-blue-500/15 text-blue-300">
                Reddit trending
              </Badge>
              <Badge variant="secondary" className="bg-violet-500/15 text-violet-300">
                Pricing complaints
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
