import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Check, Play } from "lucide-react"
import { trendingTopics } from "@/data/landingData"
import { HeroPreviewCard } from "@/components/landing/HeroPreviewCard"

export function HeroSection() {
  const [topicIndex, setTopicIndex] = useState(0)
  const [displayText, setDisplayText] = useState("")
  const [typing, setTyping] = useState(true)

  useEffect(() => {
    const topic = trendingTopics[topicIndex]
    let charIndex = 0
    setDisplayText("")
    setTyping(true)

    const typeInterval = setInterval(() => {
      if (charIndex <= topic.length) {
        setDisplayText(topic.slice(0, charIndex))
        charIndex++
      } else {
        clearInterval(typeInterval)
        setTyping(false)
      }
    }, 80)

    return () => clearInterval(typeInterval)
  }, [topicIndex])

  useEffect(() => {
    const cycle = setInterval(() => {
      setTopicIndex((i) => (i + 1) % trendingTopics.length)
    }, 3000)
    return () => clearInterval(cycle)
  }, [])

  return (
    <section className="relative overflow-hidden bg-background pt-16">
      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 md:px-8 lg:grid-cols-[55%_45%] lg:py-28">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
            <span className="inline-block size-1.5 animate-pulse rounded-full bg-primary" />
            AI-Powered Opinion Intelligence Platform
          </div>

          <h1 className="font-serif-display mb-6 text-5xl font-medium leading-[1.1] tracking-normal text-foreground md:text-6xl lg:text-7xl">
            Track What The
            <span className="block text-primary">World Thinks</span>
            In Real Time
          </h1>

          <p className="mb-4 max-w-lg text-lg leading-relaxed text-muted-foreground">
            OpinionPulse aggregates and analyzes public opinion from Reddit, YouTube,
            NewsAPI, Guardian, and 6 more sources. Powered by AI to detect debates,
            predict trends, and summarize what millions of people are saying — instantly.
          </p>

          <p className="mb-8 text-sm text-primary">
            Currently trending: &ldquo;{displayText}
            <span className={typing ? "animate-pulse" : ""}>|</span>&rdquo;
          </p>

          <div className="mb-10 flex flex-wrap items-center gap-4">
            <Link
              to="/auth/signup"
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90"
            >
              Start Tracking Free
              <ArrowRight size={18} />
            </Link>
            <a
              href="#demo"
              className="flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-foreground transition-colors duration-200 hover:border-muted-foreground/30 hover:bg-muted/40"
            >
              <Play size={16} fill="currentColor" />
              Watch Demo
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-success" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-success" />
              10 free data sources
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-success" />
              Free forever plan
            </span>
          </div>
        </div>

        <div className="lg:pl-4">
          <HeroPreviewCard />
        </div>
      </div>
    </section>
  )
}
