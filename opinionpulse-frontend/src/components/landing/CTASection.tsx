import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-950/80 via-slate-900 to-violet-950/80 px-8 py-12 text-center shadow-2xl md:px-16 md:py-16">
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Start Understanding Public Opinion Today
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Create your first tracking project and explore sentiment insights across
            Reddit, YouTube, and news — no backend required for this demo.
          </p>
          <Button
            render={<Link to="/signup" />}
            size="lg"
            className="mt-8 gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:opacity-90"
          >
            Create Your First Tracking Project
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
