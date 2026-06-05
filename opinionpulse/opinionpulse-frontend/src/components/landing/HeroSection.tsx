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
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f0f1a] via-[#1a0a2e] to-[#0d1117] pt-16">
      <ThreeBackground />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 md:px-8 lg:grid-cols-[55%_45%] lg:py-24">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-300">
            <span className="inline-block size-1.5 animate-pulse rounded-full bg-purple-400" />
            AI-Powered Opinion Intelligence Platform
          </div>

          <h1 className="mb-6 text-5xl font-bold leading-[1.1] tracking-tight text-white md:text-6xl lg:text-7xl">
            Track What The
            <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              World Thinks
            </span>
            In Real Time
          </h1>

          <p className="mb-4 max-w-lg text-lg leading-relaxed text-gray-400">
            OpinionPulse aggregates and analyzes public opinion from Reddit, YouTube,
            NewsAPI, Guardian, and 6 more sources. Powered by AI to detect debates,
            predict trends, and summarize what millions of people are saying — instantly.
          </p>

          <p className="mb-8 text-sm text-purple-400">
            Currently trending: &ldquo;{displayText}
            <span className={typing ? "animate-pulse" : ""}>|</span>&rdquo;
          </p>

          <div className="mb-10 flex flex-wrap items-center gap-4">
            <Link
              to="/auth/signup"
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/25 transition-all duration-200 hover:scale-105 hover:bg-purple-500 hover:shadow-purple-500/40"
            >
              Start Tracking Free
              <ArrowRight size={18} />
            </Link>
            <a
              href="#demo"
              className="flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-white/80 transition-all duration-200 hover:border-white/40 hover:bg-white/5 hover:text-white"
            >
              <Play size={16} fill="currentColor" />
              Watch Demo
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-green-400" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-green-400" />
              10 free data sources
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-green-400" />
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
