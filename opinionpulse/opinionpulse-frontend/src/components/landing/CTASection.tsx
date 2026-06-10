import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/landing/ScrollReveal"

export function CTASection() {
  return (
    <section className="border-t border-border bg-background py-24 md:py-32">
      <div className="mx-auto max-w-xl px-4 text-center md:px-8">
        <ScrollReveal>
          <h2 className="font-serif-display text-4xl font-medium tracking-normal text-foreground md:text-5xl">
            Start Tracking Opinion
            <span className="mt-2 block text-primary">In Real Time →</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Free to use. No credit card. 10 data sources ready.
          </p>
          <Link
            to="/auth/signup"
            className="mt-10 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-10 py-4 text-lg font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90 sm:w-auto"
          >
            Get Started Free
            <ArrowRight className="size-5" />
          </Link>
          <p className="mt-6 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/auth/signin" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
