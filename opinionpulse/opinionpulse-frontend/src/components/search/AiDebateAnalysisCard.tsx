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
  if (l === "heated") return "border-primary/20 bg-accent/50 text-foreground"
  if (l === "medium") return "border-border bg-muted/40 text-muted-foreground"
  return "border-border bg-muted/40 text-muted-foreground"
}

function SideBlock({
  side,
  sideKey,
  winning,
}: {
  side: AiDebateAnalysis["side_a"]
  sideKey: "side_a" | "side_b"
  winning: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        winning ? "border-success/40 bg-success/5" : "border-border"
      )}
    >
      <p className="text-xs font-semibold uppercase text-muted-foreground">
        {sideKey === "side_a" ? "Side A" : "Side B"}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{side.label}</p>
      <div className="mt-3 space-y-2 text-xs">
        <p>
          <span className="font-medium text-muted-foreground">Strength →</span>{" "}
          {side.strength}
        </p>
        <p>
          <span className="font-medium text-muted-foreground">Top Argument →</span>{" "}
          {side.top_argument}
        </p>
      </div>
    </div>
  )
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
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
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

  const intensity = debate.debate_intensity ?? "medium"
  const winnerLabel =
    debate.who_is_winning === "side_a"
      ? debate.side_a.label
      : debate.who_is_winning === "side_b"
        ? debate.side_b.label
        : "Tied"

  return (
    <div className={cn(proCard, "overflow-hidden")}>
      <div className="border-b border-border bg-muted/40 px-5 py-4">
        <h3 className={sectionTitle}>AI Debate Analysis</h3>
        <p className="mt-1 text-base font-medium text-foreground">{debate.topic}</p>
        <span
          className={cn(
            "mt-2 inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
            intensityStyle(intensity)
          )}
        >
          Intensity: {intensity}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
        <SideBlock
          side={debate.side_a}
          sideKey="side_a"
          winning={debate.who_is_winning === "side_a"}
        />
        <SideBlock
          side={debate.side_b}
          sideKey="side_b"
          winning={debate.who_is_winning === "side_b"}
        />
      </div>

      <div className="border-t border-border px-5 py-3 text-sm">
        <p>
          <span className="font-medium text-foreground">Winning →</span> {winnerLabel}
        </p>
        <p className="mt-1 text-muted-foreground">
          <span className="font-medium text-foreground">Reason →</span>{" "}
          {debate.winning_reason}
        </p>
      </div>
    </div>
  )
}
