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

function ConfidenceMeter({ level }: { level: number }) {
  const clamped = Math.min(10, Math.max(1, Math.round(level)))
  const color =
    clamped >= 7 ? "bg-success" : clamped >= 4 ? "bg-primary/60" : "bg-muted-foreground/30"

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "size-2 rounded-full",
              i < clamped ? color : "bg-muted"
            )}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-muted-foreground">
        {clamped}/10
      </span>
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

  return (
    <div
      className={cn(
        proCard,
        "border-l-4 p-6",
        meta.border
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className={sectionTitle}>
          AI Trend Prediction
        </h3>
        <span className="text-xs font-medium text-muted-foreground">
          7-day outlook
        </span>
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
        <ConfidenceMeter level={prediction.confidence_level} />
      </div>

      <p className="mt-4 text-sm font-medium leading-relaxed text-foreground">
        {prediction.prediction}
      </p>

      <div className="mt-4">
        <p className="text-xs font-medium text-muted-foreground">
          Why this is happening
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{prediction.reasoning}</p>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <p className="text-xs font-medium text-muted-foreground">Key drivers</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {prediction.key_drivers.map((d) => (
            <span
              key={d}
              className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs"
            >
              {d}
            </span>
          ))}
        </div>
      </div>

      <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
        <li>
          <span className="font-medium text-foreground">Watch for:</span> {prediction.watch_for}
        </li>
        <li>
          <span className="font-medium text-foreground">Could reverse if:</span>{" "}
          {prediction.turning_point}
        </li>
        <li>
          <span className="font-medium text-foreground">Platform driving narrative:</span>{" "}
          {prediction.platform_insight}
        </li>
      </ul>

      <p className="mt-3 text-xs italic text-muted-foreground">{prediction.short_forecast}</p>
    </div>
  )
}
