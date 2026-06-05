import { ArrowDown, ArrowRight, ArrowUp, RefreshCw, Zap } from "lucide-react"
import type { AiTrendPrediction } from "@/api/ai"
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
      label: "RISING",
      icon: ArrowUp,
      badge: "bg-green-100 text-green-800",
      border: "border-l-green-500",
    }
  }
  if (d.includes("falling")) {
    return {
      label: "FALLING",
      icon: ArrowDown,
      badge: "bg-red-100 text-red-800",
      border: "border-l-red-500",
    }
  }
  if (d.includes("volatile")) {
    return {
      label: "VOLATILE",
      icon: Zap,
      badge: "bg-orange-100 text-orange-800",
      border: "border-l-orange-500",
    }
  }
  return {
    label: "STABLE",
    icon: ArrowRight,
    badge: "bg-gray-100 text-gray-700",
    border: "border-l-gray-400",
  }
}

function ConfidenceMeter({ level }: { level: number }) {
  const clamped = Math.min(10, Math.max(1, Math.round(level)))
  const color =
    clamped >= 7 ? "bg-green-500" : clamped >= 4 ? "bg-yellow-400" : "bg-gray-300"

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "size-2 rounded-full",
              i < clamped ? color : "bg-gray-200"
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
      <div className="rounded-xl border border-gray-200 bg-white dark:border-[#2d2d44] dark:bg-[#1e1e30] p-6">
        <p className="animate-pulse text-sm text-muted-foreground">
          📈 AI is predicting opinion trends…
        </p>
        <div className="mt-4 h-24 animate-pulse rounded-lg bg-gray-100" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white dark:border-[#2d2d44] dark:bg-[#1e1e30] p-6 text-center">
        <p className="text-sm text-muted-foreground">🤖 {error}</p>
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
        "rounded-xl border border-gray-200 border-l-4 bg-white p-6",
        meta.border
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-[15px] font-semibold text-foreground">
          📈 AI Trend Prediction
        </h3>
        <span className="text-[10px] font-medium text-muted-foreground">
          🎯 7-day outlook
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold uppercase",
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
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          Why this is happening
        </p>
        <p className="mt-1 text-sm text-gray-700">{prediction.reasoning}</p>
      </div>

      <div className="mt-4 border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-muted-foreground">Key drivers</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {prediction.key_drivers.map((d) => (
            <span
              key={d}
              className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs"
            >
              📌 {d}
            </span>
          ))}
        </div>
      </div>

      <ul className="mt-4 space-y-1 text-sm text-gray-700">
        <li>
          <span className="font-medium">⚠️ Watch for:</span> {prediction.watch_for}
        </li>
        <li>
          <span className="font-medium">🔄 Could reverse if:</span>{" "}
          {prediction.turning_point}
        </li>
        <li>
          <span className="font-medium">📱 Platform driving narrative:</span>{" "}
          {prediction.platform_insight}
        </li>
      </ul>

      <p className="mt-3 text-xs italic text-gray-500">{prediction.short_forecast}</p>
    </div>
  )
}
