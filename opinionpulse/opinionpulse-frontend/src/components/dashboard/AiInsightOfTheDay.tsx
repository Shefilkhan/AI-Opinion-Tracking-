import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2, Sparkles } from "lucide-react"
import { getAiInsightOfTheDay, getAiStatus, type AiInsightOfTheDay } from "@/api/ai"

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
    <section className="rounded-xl border border-purple-100 border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-semibold text-foreground">
          🤖 AI Insight of the Day
        </h2>
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-700">
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
          <p className="mt-2 text-sm font-medium text-purple-900">
            Topic: {insight.topic}
          </p>
          <p className="mt-3 text-base font-semibold leading-snug text-foreground">
            &ldquo;{insight.headline}&rdquo;
          </p>
          <p className="mt-2 text-sm text-gray-700">{insight.overview}</p>
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
