import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { btnPrimary, cardSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

export function CTASection() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div
          className={cn(
            "rounded-lg px-8 py-12 text-center md:px-16 md:py-16",
            cardSurface
          )}
        >
          <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Start Understanding Public Opinion Today
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Search any topic and explore sentiment insights across Twitter/X, Reddit,
            YouTube, and news — demo mode works without API keys.
          </p>
          <Button
            render={<Link to="/auth/signup" />}
            size="lg"
            className={cn("mt-8 gap-2", btnPrimary)}
          >
            Start Tracking Opinion
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
