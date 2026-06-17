import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2, Sparkles } from "lucide-react"
import { getAiInsightOfTheDay, getAiStatus, type AiInsightOfTheDay } from "@/api/ai"
import { DashboardSection } from "@/components/dashboard/DashboardSection"
import { dashCardStatic } from "@/lib/dash-classes"
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
    <DashboardSection
      title="AI insight of the day"
      action={
        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--dash-border)] bg-[var(--dash-surface-alt)] px-2 py-0.5 text-[10px] font-medium text-[var(--dash-text-faint)]">
          <Sparkles className="size-3" strokeWidth={2} />
          Powered by Claude
        </span>
      }
    >
      <div className={cn(dashCardStatic, "p-5")}>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-[var(--dash-text-mid)]">
            <Loader2 className="size-4 animate-spin" />
            Generating today&apos;s insight…
          </div>
        ) : insight ? (
          <>
            <p className="text-sm font-medium text-[var(--dash-text-mid)]">
              Topic: {insight.topic}
            </p>
            <p className="mt-3 text-base font-semibold leading-snug text-[var(--dash-text)]">
              &ldquo;{insight.headline}&rdquo;
            </p>
            <p className="mt-2 text-sm text-[var(--dash-text-mid)]">
              {insight.overview}
            </p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  navigate(`/search?q=${encodeURIComponent(insight.query)}`)
                }
                className="cursor-pointer border-none bg-transparent text-sm font-semibold text-[var(--dash-accent)]"
              >
                Explore →
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-[var(--dash-text-mid)]">
            AI insight will appear when trending data is available.
          </p>
        )}
      </div>
    </DashboardSection>
  )
}
