import { RefreshCw } from "lucide-react"
import type { AiDebateAnalysis } from "@/api/ai"
import { cn } from "@/lib/utils"

type AiDebateAnalysisCardProps = {
  debate: AiDebateAnalysis | null
  loading: boolean
  error: string | null
  onRetry?: () => void
}

function intensityStyle(level: string) {
  const l = level.toLowerCase()
  if (l === "explosive") {
    return "bg-red-600 text-white animate-pulse"
  }
  if (l === "high") return "bg-orange-500 text-white"
  if (l === "medium") return "bg-blue-600 text-white"
  return "bg-gray-500 text-white"
}

export function AiDebateAnalysisCard({
  debate,
  loading,
  error,
  onRetry,
}: AiDebateAnalysisCardProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white dark:border-[#2d2d44] dark:bg-[#1e1e30] p-6">
        <p className="animate-pulse text-sm text-muted-foreground">
          ⚖️ AI is analyzing both sides of the debate…
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="h-40 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-40 animate-pulse rounded-lg bg-gray-100" />
        </div>
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

  if (!debate) return null

  const proWin = debate.winning_side === "pro"
  const conWin = debate.winning_side === "con"
  const intensity = debate.debate_intensity?.toUpperCase() ?? "MEDIUM"

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-[#2d2d44] dark:bg-[#1e1e30]">
      <div className="border-b border-gray-100 bg-gray-50/80 px-5 py-4">
        <h3 className="text-[15px] font-semibold text-foreground">
          ⚖️ AI Debate Analysis
        </h3>
        <p className="mt-1 text-base font-medium text-foreground">
          {debate.debate_title}
        </p>
        <span
          className={cn(
            "mt-2 inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase",
            intensityStyle(debate.debate_intensity)
          )}
        >
          Intensity: 🔥 {intensity}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        <div
          className={cn(
            "border-b border-gray-100 p-5 md:border-b-0 md:border-r",
            proWin && "border-l-4 border-l-green-500 bg-green-50/30"
          )}
        >
          <p className="text-xs font-bold uppercase text-green-700">
            ✅ {debate.pro_side.label}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {debate.pro_side.who_believes_this}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-gray-800">
            &ldquo;{debate.pro_side.strongest_argument}&rdquo;
          </p>
          <ul className="mt-3 list-inside list-disc text-xs text-gray-600">
            {(debate.pro_side.supporting_points ?? []).map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
        <div
          className={cn(
            "p-5",
            conWin && "border-l-4 border-l-red-500 bg-red-50/30"
          )}
        >
          <p className="text-xs font-bold uppercase text-red-700">
            ❌ {debate.con_side.label}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {debate.con_side.who_believes_this}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-gray-800">
            &ldquo;{debate.con_side.strongest_argument}&rdquo;
          </p>
          <ul className="mt-3 list-inside list-disc text-xs text-gray-600">
            {(debate.con_side.opposing_points ?? []).map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-100 bg-amber-50/50 px-5 py-3 text-sm">
        <span className="font-medium">🤝 Middle ground:</span> {debate.middle_ground}
      </div>

      <div className="border-t border-gray-100 px-5 py-3 text-sm text-gray-700">
        <p>
          <span className="font-medium">🏆 Currently winning:</span>{" "}
          {debate.winning_side === "pro"
            ? debate.pro_side.label
            : debate.winning_side === "con"
              ? debate.con_side.label
              : "Neither side clearly ahead"}
        </p>
        <p className="mt-2">
          <span className="font-medium">🎓 Expert take:</span> {debate.expert_take}
        </p>
      </div>
    </div>
  )
}
