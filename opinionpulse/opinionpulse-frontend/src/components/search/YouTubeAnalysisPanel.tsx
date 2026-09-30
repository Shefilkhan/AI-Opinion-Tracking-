import { BarChart3, MessageSquare, Play, ThumbsUp, Users } from "lucide-react"
import type { SentimentLabel, YouTubeSummary } from "@/lib/api/types"
import { sentimentBadgeClass, sentimentBadgeLabel } from "@/lib/api/sentiment"
import { proCard } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function SentimentBar({
  label,
  data,
}: {
  label: string
  data: { positive: number; neutral: number; negative: number }
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--dash-text-faint)]">
        {label}
      </p>
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        <div className="bg-emerald-500" style={{ width: `${data.positive}%` }} title="Positive" />
        <div className="bg-slate-400" style={{ width: `${data.neutral}%` }} title="Neutral" />
        <div className="bg-red-500" style={{ width: `${data.negative}%` }} title="Negative" />
      </div>
      <div className="mt-1.5 flex gap-3 text-[11px] text-[var(--dash-text-mid)]">
        <span className="text-emerald-600">{data.positive}% pos</span>
        <span>{data.neutral}% neu</span>
        <span className="text-red-600">{data.negative}% neg</span>
      </div>
    </div>
  )
}

type YouTubeAnalysisPanelProps = {
  summary: YouTubeSummary | null | undefined
}

export function YouTubeAnalysisPanel({ summary }: YouTubeAnalysisPanelProps) {
  if (!summary || summary.videos_analyzed === 0) return null

  const mostNegative = summary.theme_sentiment
    .filter((t) => t.mentions >= 5)
    .sort((a, b) => b.negative - a.negative)[0]

  return (
    <div className={cn(proCard, "overflow-hidden border-l-4 border-l-red-600")}>
      <div className="border-b border-[var(--dash-border)] px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Play className="size-5 text-red-600" />
          <h3 className="text-base font-semibold text-[var(--dash-text)]">YouTube Analysis</h3>
        </div>
        <p className="mt-1 text-xs text-[var(--dash-text-faint)]">
          Creator framing vs audience reaction · weighted by{" "}
          <code className="text-[10px]">{summary.engagement_weight_formula}</code>
        </p>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
        {[
          { icon: Play, label: "Videos", value: summary.videos_analyzed },
          { icon: MessageSquare, label: "Comments", value: summary.comments_analyzed },
          { icon: Users, label: "Replies", value: summary.replies_analyzed },
          { icon: BarChart3, label: "Total views", value: formatCount(summary.total_views) },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg bg-[var(--dash-bg)] px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[var(--dash-text-faint)]">
              <stat.icon className="size-3.5" />
              <span className="text-[10px] font-semibold uppercase">{stat.label}</span>
            </div>
            <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--dash-text)]">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 border-t border-[var(--dash-border)] px-5 py-5 sm:grid-cols-3 sm:px-6">
        <SentimentBar label="Creator sentiment" data={summary.creator_sentiment} />
        <SentimentBar label="Audience sentiment" data={summary.audience_sentiment} />
        <SentimentBar
          label="Engagement-weighted audience"
          data={summary.engagement_weighted_audience_sentiment}
        />
      </div>

      {summary.top_themes.length > 0 && (
        <div className="border-t border-[var(--dash-border)] px-5 py-5 sm:px-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--dash-text-faint)]">
            Top audience themes
          </p>
          <div className="flex flex-wrap gap-2">
            {summary.top_themes.slice(0, 8).map((theme) => (
              <span
                key={theme.label}
                className="rounded-full border border-[var(--dash-border)] bg-[var(--dash-bg)] px-3 py-1 text-xs font-medium text-[var(--dash-text)]"
              >
                {theme.label}{" "}
                <span className="text-[var(--dash-text-faint)]">{theme.count}</span>
              </span>
            ))}
          </div>
          {mostNegative && mostNegative.negative >= 40 && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50/50 px-4 py-3 dark:border-red-900/40 dark:bg-red-950/20">
              <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                Most negative theme: {mostNegative.label}
              </p>
              <p className="mt-0.5 text-xs text-[var(--dash-text-mid)]">
                {mostNegative.negative}% negative · {mostNegative.mentions} mentions
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-4 border-t border-[var(--dash-border)] px-5 py-3 text-xs text-[var(--dash-text-faint)] sm:px-6">
        <span className="inline-flex items-center gap-1">
          <ThumbsUp className="size-3" />
          {formatCount(summary.total_likes)} video likes
        </span>
        <span>{formatCount(summary.total_comments)} video comment counts</span>
      </div>
    </div>
  )
}

export function YouTubeSentimentBadge({ sentiment }: { sentiment: SentimentLabel }) {
  return (
    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", sentimentBadgeClass(sentiment))}>
      {sentimentBadgeLabel(sentiment)}
    </span>
  )
}
