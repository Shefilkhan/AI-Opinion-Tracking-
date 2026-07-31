import { useMemo } from "react"
import type { SearchResponse } from "@/lib/api/types"
import { proCard, cardTitle } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"
import { analyzeSentiment } from "@/lib/api/sentiment"

type WordCloudChartProps = {
  data: SearchResponse
}

export function WordCloudChart({ data }: WordCloudChartProps) {
  const keywords = data.trending_keywords || []

  // Stable pseudo-random order (deterministic hash of the word) keeps the
  // "cloud" look without reshuffling on every render — Math.random() during
  // render is impure. Declared before the early return so the hook order
  // stays constant (rules-of-hooks).
  const shuffledKeywords = useMemo(() => {
    const hash = (s: string) => {
      let h = 0
      for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0
      return h
    }
    return [...keywords].sort((a, b) => hash(a.word) - hash(b.word))
  }, [keywords])

  if (keywords.length === 0) {
    return null
  }

  // Find max count to scale fonts
  const maxCount = Math.max(...keywords.map((k) => k.count), 1)

  return (
    <div className={cn(proCard, "p-5 flex flex-col")}>
      <h3 className={cn(cardTitle, "mb-4")}>
        Trending Topics & Words
      </h3>
      <div className="h-[220px] w-full flex-1 flex flex-wrap content-center justify-center gap-x-3 gap-y-2 overflow-hidden py-2">
        {shuffledKeywords.map((kw, i) => {
          const { sentiment } = analyzeSentiment(kw.word)

          const relativeFreq = kw.count / maxCount
          const fontSize = 0.85 + relativeFreq * 1.65
          const fontWeight = relativeFreq > 0.55 ? 700 : relativeFreq > 0.25 ? 600 : 500

          let colorClass = "text-slate-800 dark:text-slate-100"
          if (sentiment === "positive") {
            colorClass = "text-emerald-700 dark:text-emerald-400"
          }
          if (sentiment === "negative") {
            colorClass = "text-red-600 dark:text-red-400"
          }

          return (
            <span
              key={`${kw.word}-${i}`}
              className={cn(
                "inline-block cursor-default transition-transform hover:scale-110",
                colorClass
              )}
              style={{
                fontSize: `${fontSize}rem`,
                fontWeight,
                lineHeight: 1.15,
              }}
              title={`${kw.word} (${kw.count} mentions)`}
            >
              {kw.word}
            </span>
          )
        })}
      </div>
    </div>
  )
}
