import { RefreshCw } from "lucide-react"
import type { AiDebateAnalysis } from "@/api/ai"
import { proCard, sectionTitle } from "@/lib/ui-classes"
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
    return "border-destructive/30 bg-destructive/10 text-destructive"
  }
  if (l === "high") return "border-primary/20 bg-accent/50 text-foreground"
  if (l === "medium") return "border-border bg-muted/40 text-muted-foreground"
  return "border-border bg-muted/40 text-muted-foreground"
}

export function AiDebateAnalysisCard({
  debate,
  loading,
  error,
  onRetry,
}: AiDebateAnalysisCardProps) {
  if (loading) {
    return (
      <div className={cn(proCard, "p-6")}>
        <p className="animate-pulse text-sm text-muted-foreground">
          AI is analyzing both sides of the debate…
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="h-40 animate-pulse rounded-lg bg-muted" />
          <div className="h-40 animate-pulse rounded-lg bg-muted" />
        </div>
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

  if (!debate) return null

  const proWin = debate.winning_side === "pro"
  const conWin = debate.winning_side === "con"
  const intensity = debate.debate_intensity ?? "medium"

  return (
    <div className={cn(proCard, "overflow-hidden")}>
      <div className="border-b border-border bg-muted/40 px-5 py-4">
        <h3 className={sectionTitle}>
          AI Debate Analysis
        </h3>
        <p className="mt-1 text-base font-medium text-foreground">
          {debate.debate_title}
        </p>
        <span
          className={cn(
            "mt-2 inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
            intensityStyle(debate.debate_intensity)
          )}
        >
          Intensity: {intensity}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        <div
          className={cn(
            "border-b border-border p-5 md:border-b-0 md:border-r",
            proWin && "border-l-4 border-l-success bg-success/5"
          )}
        >
          <p className="text-xs font-medium text-success">
            {debate.pro_side.label}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {debate.pro_side.who_believes_this}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            &ldquo;{debate.pro_side.strongest_argument}&rdquo;
          </p>
          <ul className="mt-3 list-inside list-disc text-xs text-muted-foreground">
            {(debate.pro_side.supporting_points ?? []).map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
        <div
          className={cn(
            "p-5",
            conWin && "border-l-4 border-l-destructive bg-destructive/5"
          )}
        >
          <p className="text-xs font-medium text-destructive">
            {debate.con_side.label}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {debate.con_side.who_believes_this}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            &ldquo;{debate.con_side.strongest_argument}&rdquo;
          </p>
          <ul className="mt-3 list-inside list-disc text-xs text-muted-foreground">
            {(debate.con_side.opposing_points ?? []).map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border bg-accent/30 px-5 py-3 text-sm">
        <span className="font-medium">Middle ground:</span> {debate.middle_ground}
      </div>

      <div className="border-t border-border px-5 py-3 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Currently winning:</span>{" "}
          {debate.winning_side === "pro"
            ? debate.pro_side.label
            : debate.winning_side === "con"
              ? debate.con_side.label
              : "Neither side clearly ahead"}
        </p>
        <p className="mt-2">
          <span className="font-medium text-foreground">Expert take:</span> {debate.expert_take}
        </p>
      </div>
    </div>
  )
}
