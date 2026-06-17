import { Link } from "react-router-dom"
import type { ReactNode } from "react"
import { useUsage } from "@/hooks/useUsage"
import { cn } from "@/lib/utils"

type AIFeatureCardProps = {
  feature: "ai_opinion_summary" | "ai_debate_analysis" | "ai_trend_prediction"
  children: ReactNode
}

export function AIFeatureCard({ feature, children }: AIFeatureCardProps) {
  const { usage } = useUsage()
  const enabled = usage?.features?.[feature] ?? false

  if (enabled || !usage) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      <div
        className="pointer-events-none select-none blur-[3px]"
        aria-hidden
      >
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/40 backdrop-blur-[2px]">
        <Link
          to="/pricing"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2",
            "text-sm font-semibold text-primary-foreground no-underline shadow-sm"
          )}
        >
          🔒 Unlock with Pro
        </Link>
      </div>
    </div>
  )
}
