import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2, Sparkles } from "lucide-react"
import { getAiInsightOfTheDay, getAiStatus, type AiInsightOfTheDay } from "@/api/ai"
import { proCard, sectionTitle } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

export function AiInsightOfTheDay() {
  const navigate = useNavigate()
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [insight, setInsight] = useState<AiInsightOfTheDay | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getAiStatus()
      .then(async (s) => {
        setEnabled(s.enabled)
        if (!s.enabled) return
        setLoading(true)
        try {
          const res = await getAiInsightOfTheDay()
          if (res.insight) setInsight(res.insight)
        } finally {
          setLoading(false)
        }
      })
      .catch(() => setEnabled(false))
  }, [])

  if (enabled === false || enabled === null) {
    return null
  }

  return (
    <section className={cn(proCard, "border-l-4 border-l-primary p-5")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={sectionTitle}>
          AI Insight of the Day
        </h2>
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          <Sparkles className="size-3" />
          Powered by Claude
        </span>
      </div>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Generating today&apos;s insight…
        </div>
      ) : insight ? (
        <>
          <p className="mt-2 text-sm font-medium text-foreground">
            Topic: {insight.topic}
          </p>
          <p className="mt-3 text-base font-semibold leading-snug text-foreground">
            &ldquo;{insight.headline}&rdquo;
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{insight.overview}</p>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() =>
                navigate(`/search?q=${encodeURIComponent(insight.query)}`)
              }
              className="text-sm font-medium text-primary hover:underline"
            >
              Explore →
            </button>
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          AI insight will appear when trending data is available.
        </p>
      )}
    </section>
  )
}
