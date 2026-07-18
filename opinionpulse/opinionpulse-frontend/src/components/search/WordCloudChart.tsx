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
          
          // Calculate font size between 0.8rem and 2.5rem based on relative frequency
          const relativeFreq = kw.count / maxCount
          const fontSize = 0.8 + (relativeFreq * 1.7)
          
          // Let's add some opacity variance based on frequency too
          const opacity = 0.5 + (relativeFreq * 0.5)

          let colorClass = "text-muted-foreground"
          if (sentiment === "positive") colorClass = "text-green-500 font-medium"
          if (sentiment === "negative") colorClass = "text-red-500 font-medium"

          return (
            <span
              key={`${kw.word}-${i}`}
              className={cn(
                "inline-block transition-transform hover:scale-110 cursor-default",
                colorClass
              )}
              style={{
                fontSize: `${fontSize}rem`,
                opacity: opacity,
                lineHeight: "1",
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
