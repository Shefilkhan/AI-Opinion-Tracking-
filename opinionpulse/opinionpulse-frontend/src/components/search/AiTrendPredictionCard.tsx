import { ArrowDown, ArrowRight, ArrowUp, RefreshCw, Zap } from "lucide-react"
import type { AiTrendPrediction } from "@/api/ai"
import { proCard, sectionTitle } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type AiTrendPredictionCardProps = {
  prediction: AiTrendPrediction | null
  loading: boolean
  error: string | null
  onRetry?: () => void
}

function directionMeta(direction: string) {
  const d = direction.toLowerCase()
  if (d.includes("rising")) {
    return {
      label: "Rising",
      icon: ArrowUp,
      badge: "border-success/30 bg-success/10 text-success",
      border: "border-l-success",
    }
  }
  if (d.includes("falling")) {
    return {
      label: "Falling",
      icon: ArrowDown,
      badge: "border-destructive/30 bg-destructive/10 text-destructive",
      border: "border-l-destructive",
    }
  }
  if (d.includes("volatile")) {
    return {
      label: "Volatile",
      icon: Zap,
      badge: "border-primary/20 bg-accent/50 text-foreground",
      border: "border-l-primary",
    }
  }
  return {
    label: "Stable",
    icon: ArrowRight,
    badge: "border-border bg-muted/40 text-muted-foreground",
    border: "border-l-muted-foreground/40",
  }
}

function LabeledRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-2.5 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-medium capitalize text-foreground">{value}</span>
    </div>
  )
}

export function AiTrendPredictionCard({
  prediction,
  loading,
  error,
  onRetry,
}: AiTrendPredictionCardProps) {
  if (loading) {
    return (
      <div className={cn(proCard, "p-6")}>
        <p className="animate-pulse text-sm text-muted-foreground">
          AI is predicting opinion trends…
        </p>
        <div className="mt-4 h-24 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn(proCard, "p-6 text-center")}>
        <p className="text-sm text-muted-foreground">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <RefreshCw className="size-3" /> Retry
          </button>
        )}
      </div>
    )
  }

  if (!prediction) return null

  const meta = directionMeta(prediction.direction)
  const DirIcon = meta.icon
  const forecast = prediction["7_day_forecast"]
  const confidence = Math.min(100, Math.max(0, prediction.confidence_pct ?? 0))

  return (
    <div className={cn(proCard, "border-l-4 p-6", meta.border)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className={sectionTitle}>AI Trend Prediction</h3>
        <span className="text-xs font-medium text-muted-foreground">7-day outlook</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
            meta.badge
          )}
        >
          <DirIcon className="size-3.5" />
          {meta.label}
        </span>
      </div>

      <div className="mt-4">
        <LabeledRow label="Direction" value={prediction.direction} />
        <LabeledRow label="Momentum" value={prediction.momentum} />
        <LabeledRow label="7-Day Forecast" value={forecast} />
        <LabeledRow label="Key Driver" value={prediction.key_driver} />
        <LabeledRow label="Leading Platform" value={prediction.leading_platform} />
        <div className="flex items-center justify-between gap-4 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Confidence
          </span>
          <div className="flex min-w-[120px] flex-col items-end gap-1">
            <span className="text-sm font-medium">{confidence}%</span>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
