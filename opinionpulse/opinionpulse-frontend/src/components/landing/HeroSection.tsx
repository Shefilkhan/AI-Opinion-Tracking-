import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Check, Play } from "lucide-react"
import { trendingTopics } from "@/data/landingData"
import { HeroPreviewCard } from "@/components/landing/HeroPreviewCard"
import ThreeBackground from "@/components/ui/ThreeBackground"

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
    <section className="relative min-h-screen overflow-hidden bg-background pt-16">
      <ThreeBackground />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 md:px-8 lg:grid-cols-[55%_45%] lg:py-24">
        <div>
          <div className="landing-badge mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium">
            <span className="inline-block size-1.5 animate-pulse rounded-full bg-primary" />
            AI-Powered Opinion Intelligence Platform
          </div>

          <h1 className="mb-6 text-5xl font-bold leading-[1.08] tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Track What The
            <span className="block text-gradient-brand">World Thinks</span>
            In Real Time
          </h1>

          <p className="mb-4 max-w-lg text-lg leading-relaxed text-muted-foreground">
            OpinionPulse aggregates and analyzes public opinion from Reddit, YouTube,
            NewsAPI, Guardian, Bluesky, Mastodon, GitHub, and 5 more sources — powered by AI to detect debates,
            predict trends, and summarize what millions are saying, instantly.
          </p>

          <p className="mb-8 text-sm text-primary">
            Currently trending: &ldquo;{displayText}
            <span className={typing ? "animate-pulse" : ""}>|</span>&rdquo;
          </p>

          <div className="mb-10 flex flex-wrap items-center gap-4">
            <Link
              to="/auth/signup"
              className="btn-gradient flex items-center gap-2 px-6 py-3 text-base font-semibold"
            >
              Start Tracking Free
              <ArrowRight size={18} />
            </Link>
            <a
              href="#demo"
              className="flex items-center gap-2 rounded-xl border border-border bg-card/80 px-6 py-3 font-medium text-foreground backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:bg-muted/50 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
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
              13 free data sources
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
