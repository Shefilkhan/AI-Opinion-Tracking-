import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/landing/ScrollReveal"

export function CTASection() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-xl px-4 text-center md:px-8">
        <ScrollReveal>
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
            Start Tracking Opinion
            <span className="mt-2 block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              In Real Time →
            </span>
          </h2>
          <p className="mt-6 text-lg text-gray-600">
            Free to use. No credit card. 10 data sources ready.
          </p>
          <Link
            to="/auth/signup"
            className="mt-10 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-10 py-4 text-lg font-semibold text-white shadow-xl shadow-purple-500/30 transition-all duration-200 hover:scale-[1.03] hover:shadow-purple-500/40 sm:w-auto"
          >
            Get Started Free
            <ArrowRight className="size-5" />
          </Link>
          <p className="mt-6 text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/auth/signin" className="font-medium text-purple-600 hover:underline">
              Sign in
            </Link>
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
