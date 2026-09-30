import type { ScoreboardRow } from "@/lib/compare-analytics"
import { proCard } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type ComparisonScoreboardProps = {
  nameA: string
  nameB: string
  rows: ScoreboardRow[]
}

export function ComparisonScoreboard({ nameA, nameB, rows }: ComparisonScoreboardProps) {
  return (
    <section className={cn(proCard, "p-5 sm:p-6")}>
      <h3 className="compare-section-label m-0">Comparison scoreboard</h3>
      <div className="mt-4">
        <div className="compare-scoreboard-header">
          <span>Metric</span>
          <span className="text-indigo-600 dark:text-indigo-400">{nameA}</span>
          <span className="text-orange-600 dark:text-orange-400">{nameB}</span>
          <span>Lead</span>
        </div>
        {rows.map((row) => (
          <div key={row.metric} className="compare-scoreboard-row">
            <div>
              <p className="font-medium text-[var(--dash-text)]">{row.metric}</p>
              {row.hint && (
                <p className="text-[10px] text-[var(--dash-text-faint)]">{row.hint}</p>
              )}
            </div>
            <span
              className={cn(
                "font-semibold tabular-nums",
                row.leader === "a" && "text-indigo-600 dark:text-indigo-400"
              )}
            >
              {row.valueA}
            </span>
            <span
              className={cn(
                "font-semibold tabular-nums",
                row.leader === "b" && "text-orange-600 dark:text-orange-400"
              )}
            >
              {row.valueB}
            </span>
            <span>
              {row.leaderLabel && row.leader && row.leader !== "tie" && (
                <span
                  className={cn(
                    "compare-leader-pill",
                    row.leader === "a" ? "compare-leader-a" : "compare-leader-b"
                  )}
                >
                  {row.leaderLabel}
                </span>
              )}
              {row.leader === "tie" && row.leaderLabel && (
                <span className="text-[10px] text-[var(--dash-text-faint)]">{row.leaderLabel}</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
