import { Link, useNavigate } from "react-router-dom"
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Flame,
  Play,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { DashboardIntelligenceProps } from "./types"
import { DebateCard } from "@/components/dashboard/DebateCard"
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState"
import { platformBadge } from "@/lib/api/sentiment"
import { dashCardStatic } from "@/lib/dash-classes"
import { formatRelativeTime } from "@/lib/formatTimeAgo"
import { platformBrandColor } from "@/lib/platformBrandColors"
import { cn } from "@/lib/utils"

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className={cn(dashCardStatic, "p-4")}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--dash-text-faint)]">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--dash-text)]">{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--dash-text-mid)]">{hint}</p>}
    </div>
  )
}

function SentimentBar({ positive, neutral, negative }: { positive: number; neutral: number; negative: number }) {
  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full bg-[var(--dash-surface-alt)]">
        <div className="bg-[var(--dash-pos)]" style={{ width: `${positive}%` }} />
        <div className="bg-slate-400" style={{ width: `${neutral}%` }} />
        <div className="bg-[var(--dash-neg)]" style={{ width: `${negative}%` }} />
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-[var(--dash-text-mid)]">
        <span>{positive}% Positive</span>
        <span className="text-center">{neutral}% Neutral</span>
        <span className="text-right">{negative}% Negative</span>
      </div>
    </div>
  )
}

function riskBadge(level: string) {
  if (level === "critical") return "bg-red-500/10 text-red-600"
  if (level === "watch") return "bg-amber-500/10 text-amber-700"
  return "bg-[var(--dash-surface-alt)] text-[var(--dash-text-mid)]"
}

export function DashboardIntelligenceLayout({
  intelligence,
  liveDebates,
  platformPulse,
  lastUpdated,
}: DashboardIntelligenceProps) {
  const navigate = useNavigate()
  const { kpis, todays_pulse, needs_attention, all_clear_message, since_last_visit } = intelligence
  const pulse = todays_pulse

  const sentimentLabel =
    kpis.avg_sentiment_label === "positive"
      ? "Mostly Positive"
      : kpis.avg_sentiment_label === "negative"
        ? "Mostly Negative"
        : "Mostly Neutral"

  return (
    <div className="flex flex-col gap-8">
      {/* Executive header */}
      <div className={cn(dashCardStatic, "p-5 sm:p-6")}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--dash-text-faint)]">
              Overview
            </p>
            <h2 className="mt-1 font-serif-display text-2xl font-semibold text-[var(--dash-text)]">
              {greeting()}
            </h2>
            <p className="mt-2 text-sm text-[var(--dash-text-mid)]">
              Here&apos;s what changed across your tracked topics today.
            </p>
          </div>
          <div className="text-right text-xs text-[var(--dash-text-faint)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[var(--dash-pos)]" aria-hidden />
              {kpis.sources_live}/{kpis.sources_total} sources live
            </span>
            {lastUpdated && (
              <p className="mt-1">Updated {formatRelativeTime(lastUpdated)}</p>
            )}
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Monitored"
          value={`${kpis.monitored_topics} topics`}
          hint={kpis.monitored_topics ? "Brand Monitor watches" : "Add a watch in Brand Monitor"}
        />
        <KpiCard
          label="Needs attention"
          value={`${kpis.alerts_count} alert${kpis.alerts_count === 1 ? "" : "s"}`}
          hint={kpis.alerts_count ? "Review flagged topics" : "All clear"}
        />
        <KpiCard
          label="Avg sentiment"
          value={sentimentLabel}
          hint={
            kpis.sentiment_change_pp != null
              ? `${kpis.sentiment_change_pp >= 0 ? "+" : ""}${kpis.sentiment_change_pp} pp vs prior week`
              : `${kpis.avg_positive_pct.toFixed(0)}% positive`
          }
        />
        <KpiCard
          label="Data coverage"
          value={`${pulse.items_analyzed.toLocaleString()} analyzed`}
          hint={`Top source: ${pulse.top_source || kpis.top_source || "—"}`}
        />
      </div>

      {/* Attention + Today's Pulse */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <div className={cn(dashCardStatic, "p-5")}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-[var(--dash-text)]">Needs your attention</h3>
              <Link to="/alerts" className="text-xs font-medium text-[var(--dash-accent)] hover:opacity-80">
                + Monitor topic
              </Link>
            </div>
            {needs_attention.length === 0 ? (
              <div className="flex gap-3 rounded-lg bg-[var(--dash-pos-soft)] p-4 text-sm">
                <CheckCircle2 className="size-5 shrink-0 text-[var(--dash-pos)]" />
                <div>
                  <p className="font-medium text-[var(--dash-text)]">No major reputation risks detected</p>
                  <p className="mt-1 text-[var(--dash-text-mid)]">{all_clear_message}</p>
                </div>
              </div>
            ) : (
              <ul className="space-y-3">
                {needs_attention.map((item) => (
                  <li
                    key={`${item.topic}-${item.headline}`}
                    className={cn(
                      "rounded-lg border p-4",
                      item.severity === "critical"
                        ? "border-red-500/30 bg-red-500/5"
                        : "border-amber-500/30 bg-amber-500/5"
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-2 font-semibold text-[var(--dash-text)]">
                          <AlertTriangle
                            className={cn(
                              "size-4",
                              item.severity === "critical" ? "text-red-500" : "text-amber-500"
                            )}
                          />
                          {item.topic}
                        </p>
                        <p className="mt-1 text-sm text-[var(--dash-text-mid)]">{item.headline}</p>
                        {item.main_issue && (
                          <p className="mt-1 text-xs text-[var(--dash-text-faint)]">
                            Primary issue: {item.main_issue}
                            {item.main_source ? ` · ${item.main_source}` : ""}
                          </p>
                        )}
                        {item.detail && (
                          <p className="mt-1 text-xs text-[var(--dash-text-faint)]">{item.detail}</p>
                        )}
                      </div>
                      <Link
                        to={item.action_href || "/search"}
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--dash-border)] bg-[var(--dash-surface)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--dash-surface-alt)]"
                      >
                        {item.action_label || "Investigate"} <ArrowRight className="size-3" />
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="xl:col-span-5">
          <div className={cn(dashCardStatic, "h-full p-5")}>
            <h3 className="text-sm font-semibold text-[var(--dash-text)]">Today&apos;s Pulse</h3>
            <p className="mt-3 text-3xl font-semibold tabular-nums text-[var(--dash-text)]">
              {pulse.items_analyzed.toLocaleString()}
            </p>
            <p className="text-xs text-[var(--dash-text-faint)]">content items analyzed</p>
            <div className="mt-5">
              <SentimentBar
                positive={pulse.positive_pct}
                neutral={pulse.neutral_pct}
                negative={pulse.negative_pct}
              />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[var(--dash-text-faint)]">Conversation</p>
                <p className="font-semibold text-[var(--dash-text)]">
                  {pulse.activity_change_pct != null ? (
                    <>
                      {pulse.activity_change_pct >= 0 ? "↑" : "↓"} {Math.abs(pulse.activity_change_pct)}% vs yesterday
                    </>
                  ) : (
                    "Insufficient history"
                  )}
                </p>
              </div>
              <div>
                <p className="text-[var(--dash-text-faint)]">Most active</p>
                <p className="font-semibold text-[var(--dash-text)]">{pulse.top_source || "—"}</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-[var(--dash-text-faint)]">
              {pulse.sources_live}/{pulse.sources_total} sources live
            </p>
          </div>
        </div>
      </div>

      {/* Since last visit + daily brief */}
      {(since_last_visit.length > 0 || intelligence.daily_brief.length > 0) && (
        <div className={cn(dashCardStatic, "p-5")}>
          <h3 className="text-sm font-semibold text-[var(--dash-text)]">What changed since your last visit</h3>
          {intelligence.daily_brief.length > 0 && (
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-[var(--dash-text-mid)]">
              {intelligence.daily_brief.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
          {since_last_visit.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {since_last_visit.map((c) => (
                <Link
                  key={`${c.topic}-${c.metric}`}
                  to={`/search?q=${encodeURIComponent(c.topic)}`}
                  className="rounded-full border border-[var(--dash-border)] bg-[var(--dash-surface-alt)] px-3 py-1.5 text-xs font-medium text-[var(--dash-text)] hover:bg-[var(--dash-surface)]"
                >
                  {c.topic} {c.metric} {c.change}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Monitored topics */}
      {intelligence.monitored_topics.length > 0 && (
        <div className={cn(dashCardStatic, "overflow-x-auto p-0")}>
          <div className="border-b border-[var(--dash-border)] px-5 py-4">
            <h3 className="text-sm font-semibold text-[var(--dash-text)]">My monitored topics</h3>
          </div>
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-[var(--dash-border)] text-left text-xs text-[var(--dash-text-faint)]">
                <th className="px-5 py-2">Topic</th>
                <th className="px-3 py-2">Volume</th>
                <th className="px-3 py-2">Sentiment</th>
                <th className="px-3 py-2">Momentum</th>
                <th className="px-3 py-2">Risk</th>
                <th className="px-5 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {intelligence.monitored_topics.map((row) => (
                <tr key={row.watch_id} className="border-b border-[var(--dash-border)]/60 hover:bg-[var(--dash-surface-alt)]/40">
                  <td className="px-5 py-3 font-medium capitalize">{row.name}</td>
                  <td className="px-3 py-3 tabular-nums">{row.mention_count.toLocaleString()}</td>
                  <td className="px-3 py-3">{row.sentiment_label}</td>
                  <td className="px-3 py-3">
                    {row.momentum_pct != null ? (
                      <span className={row.momentum_direction === "up" ? "text-[var(--dash-pos)]" : "text-[var(--dash-neg)]"}>
                        {row.momentum_direction === "up" ? "↑" : row.momentum_direction === "down" ? "↓" : "→"}{" "}
                        {row.momentum_pct}%
                      </span>
                    ) : (
                      "Stable"
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", riskBadge(row.risk_level))}>
                      {row.risk_level === "watch" ? "Watch" : row.risk_level === "critical" ? "Crisis" : "Normal"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Link to={`/search?q=${encodeURIComponent(row.query)}`} className="text-xs text-[var(--dash-accent)]">Search</Link>
                      <Link to={`/crisis?watch=${row.watch_id}`} className="text-xs text-[var(--dash-accent)]">Crisis</Link>
                      <Link to={`/chat?q=${encodeURIComponent(row.query)}`} className="text-xs text-[var(--dash-accent)]">Pulse</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <div className={cn(dashCardStatic, "p-5")}>
            <h3 className="text-sm font-semibold text-[var(--dash-text)]">Conversation activity — 7 days</h3>
            <p className="mt-0.5 text-xs text-[var(--dash-text-faint)]">Bars = volume · lines = sentiment share</p>
            <div className="mt-4 h-[260px]">
              {intelligence.weekly_activity.some((d) => d.mentions > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={intelligence.weekly_activity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--dash-border)" opacity={0.5} />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                    <YAxis yAxisId="right" orientation="right" hide />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="right" dataKey="mentions" fill="var(--dash-border)" name="Volume" opacity={0.5} />
                    <Line yAxisId="left" type="monotone" dataKey="positive_pct" stroke="var(--dash-pos)" name="Positive" dot={false} />
                    <Line yAxisId="left" type="monotone" dataKey="negative_pct" stroke="var(--dash-neg)" name="Negative" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <DashboardEmptyState title="No weekly activity yet" description="Run searches to build your activity timeline." />
              )}
            </div>
          </div>
        </div>

        <div className="xl:col-span-5">
          <div className={cn(dashCardStatic, "p-5")}>
            <h3 className="text-sm font-semibold text-[var(--dash-text)]">Sentiment — this week</h3>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>Positive</span><span className="font-semibold text-[var(--dash-pos)]">{pulse.positive_pct}%</span></div>
              <div className="flex justify-between"><span>Neutral</span><span className="font-semibold">{pulse.neutral_pct}%</span></div>
              <div className="flex justify-between"><span>Negative</span><span className="font-semibold text-[var(--dash-neg)]">{pulse.negative_pct}%</span></div>
            </div>
            <p className="mt-4 text-sm font-medium text-[var(--dash-text)]">Overall: {sentimentLabel}</p>
            {kpis.sentiment_change_pp != null && (
              <p className="mt-1 text-xs text-[var(--dash-text-mid)]">
                vs previous week: {kpis.sentiment_change_pp >= 0 ? "+" : ""}{kpis.sentiment_change_pp} pp positive
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Platform pulse + YouTube */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className={cn(dashCardStatic, "p-0")}>
            <div className="border-b border-[var(--dash-border)] px-5 py-4">
              <h3 className="text-sm font-semibold text-[var(--dash-text)]">Platform pulse</h3>
            </div>
            <div className="divide-y divide-[var(--dash-border)]">
              {platformPulse.map((p) => {
                const badge = platformBadge(p.platform, p.label)
                const brand = platformBrandColor(p.platform)
                const net = p.sentiment_net ?? p.positive_pct - 50
                return (
                  <div key={p.platform} className="flex items-center gap-4 px-5 py-4">
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-[11px] text-sm font-bold text-white"
                      style={{ backgroundColor: brand }}
                    >
                      {badge.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[var(--dash-text)]">{p.label}</p>
                      <p className="text-xs text-[var(--dash-text-faint)]">
                        {(p.mention_count ?? 0).toLocaleString()} items · {p.mentions}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-sm font-semibold tabular-nums", net >= 0 ? "text-[var(--dash-pos)]" : "text-[var(--dash-neg)]")}>
                        {net >= 0 ? "+" : ""}{net} net
                      </p>
                      <p className="text-xs text-[var(--dash-text-faint)]">{p.positive_pct}% positive</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {intelligence.youtube_pulse && (
          <div className="lg:col-span-5">
            <div className={cn(dashCardStatic, "h-full p-5")}>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--dash-text)]">
                <Play className="size-4" /> YouTube pulse
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div><p className="text-[var(--dash-text-faint)]">Videos</p><p className="text-lg font-semibold">{intelligence.youtube_pulse.videos_count}</p></div>
                <div><p className="text-[var(--dash-text-faint)]">Views</p><p className="text-lg font-semibold">{intelligence.youtube_pulse.total_views.toLocaleString()}</p></div>
              </div>
              {intelligence.youtube_pulse.creator_positive_pct != null && (
                <p className="mt-3 text-sm">Creator sentiment: {intelligence.youtube_pulse.creator_positive_pct}% positive</p>
              )}
              {intelligence.youtube_pulse.top_theme && (
                <p className="mt-2 text-xs text-[var(--dash-text-mid)]">🔥 Most discussed: {intelligence.youtube_pulse.top_theme}</p>
              )}
              {intelligence.youtube_pulse.negative_theme && (
                <p className="mt-1 text-xs text-[var(--dash-neg)]">⚠ Most negative: {intelligence.youtube_pulse.negative_theme}</p>
              )}
              <Link to="/search?tab=youtube" className="mt-4 inline-flex text-xs font-medium text-[var(--dash-accent)]">
                View YouTube intelligence →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Emerging conversations */}
      {intelligence.emerging_conversations.length > 0 && (
        <div className={cn(dashCardStatic, "p-5")}>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--dash-text)]">
            <Flame className="size-4 text-orange-500" /> Emerging conversations
          </h3>
          <ul className="mt-4 space-y-2">
            {intelligence.emerging_conversations.map((t) => (
              <li key={t.label} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--dash-surface-alt)] px-4 py-3">
                <div>
                  <p className="font-medium text-[var(--dash-text)]">{t.label}</p>
                  <p className="text-xs text-[var(--dash-text-faint)]">
                    {t.mentions} mentions · {t.platforms.join(" · ")}
                  </p>
                </div>
                <span className={cn("text-sm font-semibold tabular-nums", t.growth_pct >= 0 ? "text-[var(--dash-pos)]" : "text-[var(--dash-neg)]")}>
                  {t.growth_pct >= 0 ? "+" : ""}{t.growth_pct}%
                  {t.negative_pct != null && t.negative_pct >= 50 && ` · ${t.negative_pct}% neg`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Live intelligence feed */}
      {liveDebates.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--dash-text)]">Live intelligence</h3>
            <Link to="/search" className="text-xs font-medium text-[var(--dash-accent)]">Explore all</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {liveDebates.slice(0, 6).map((d) => (
              <DebateCard key={`${d.topic}-${d.headline}`} debate={d} />
            ))}
          </div>
        </div>
      )}

      {/* Grouped recent analyses */}
      {intelligence.grouped_recent_analyses.length > 0 && (
        <div className={cn(dashCardStatic, "p-0")}>
          <div className="border-b border-[var(--dash-border)] px-5 py-4">
            <h3 className="text-sm font-semibold text-[var(--dash-text)]">Recent analyses</h3>
          </div>
          <ul className="divide-y divide-[var(--dash-border)]">
            {intelligence.grouped_recent_analyses.map((row) => (
              <li key={row.query} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-[var(--dash-surface-alt)]/40">
                <div>
                  <p className="font-medium capitalize text-[var(--dash-text)]">{row.query}</p>
                  <p className="text-xs text-[var(--dash-text-faint)]">
                    {row.search_count_today > 0 && `${row.search_count_today} searches today · `}
                    Latest: {row.latest_results_count} analyzed items · {formatRelativeTime(row.last_searched_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {row.latest_sentiment_net != null && (
                    <span className={cn("text-sm font-semibold tabular-nums", row.latest_sentiment_net >= 0 ? "text-[var(--dash-pos)]" : "text-[var(--dash-neg)]")}>
                      {row.latest_sentiment_net >= 0 ? "+" : ""}{row.latest_sentiment_net}%
                    </span>
                  )}
                  <Link to={`/search?q=${encodeURIComponent(row.query)}`} className="text-xs font-medium text-[var(--dash-accent)]">Open</Link>
                  <Link to={`/compare?a=${encodeURIComponent(row.query)}`} className="text-xs text-[var(--dash-text-faint)]">Compare</Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Clean trending topics */}
      {intelligence.trending_topics_clean.length > 0 && (
        <div className={cn(dashCardStatic, "overflow-x-auto p-0")}>
          <div className="border-b border-[var(--dash-border)] px-5 py-4">
            <h3 className="text-sm font-semibold text-[var(--dash-text)]">Trending topics</h3>
            <p className="text-xs text-[var(--dash-text-faint)]">Clean themes extracted from live conversation data</p>
          </div>
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-[var(--dash-border)] text-left text-xs text-[var(--dash-text-faint)]">
                <th className="px-5 py-2">Topic</th>
                <th className="px-3 py-2">Mentions</th>
                <th className="px-3 py-2">Growth</th>
                <th className="px-3 py-2">Sentiment</th>
                <th className="px-5 py-2">Platforms</th>
              </tr>
            </thead>
            <tbody>
              {intelligence.trending_topics_clean.map((t) => (
                <tr
                  key={t.name}
                  className="cursor-pointer border-b border-[var(--dash-border)]/60 hover:bg-[var(--dash-surface-alt)]/40"
                  onClick={() => navigate(`/search?q=${encodeURIComponent(t.query || t.name)}`)}
                >
                  <td className="px-5 py-3 font-medium">{t.name}</td>
                  <td className="px-3 py-3 tabular-nums">{t.mentions.toLocaleString()}</td>
                  <td className="px-3 py-3">
                    {t.growth_pct != null ? (
                      <span className="inline-flex items-center gap-0.5 text-[var(--dash-pos)]">
                        <TrendingUp className="size-3" /> {t.growth_pct}%
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-3">{t.sentiment_label}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {t.platforms.slice(0, 3).map((p) => (
                        <span key={p} className="rounded-full bg-[var(--dash-surface-alt)] px-2 py-0.5 text-[10px] font-medium">{p}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Comparison suggestions + biggest movers */}
      {(intelligence.comparison_suggestions.length > 0 || intelligence.biggest_movers.volume.length > 0) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {intelligence.comparison_suggestions.length > 0 && (
            <div className={cn(dashCardStatic, "p-5")}>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--dash-text)]">
                <BarChart3 className="size-4" /> Interesting comparisons
              </h3>
              <ul className="mt-3 space-y-2">
                {intelligence.comparison_suggestions.map((s) => (
                  <li key={s.label}>
                    <Link
                      to={`/compare?a=${encodeURIComponent(s.query_a)}&b=${encodeURIComponent(s.query_b)}`}
                      className="block rounded-lg border border-[var(--dash-border)] px-3 py-2 text-sm hover:bg-[var(--dash-surface-alt)]"
                    >
                      <p className="font-medium">{s.label}</p>
                      {s.reason && <p className="text-xs text-[var(--dash-text-faint)]">{s.reason}</p>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(intelligence.biggest_movers.sentiment.length > 0 || intelligence.biggest_movers.volume.length > 0) && (
            <div className={cn(dashCardStatic, "p-5")}>
              <h3 className="text-sm font-semibold text-[var(--dash-text)]">Biggest movers</h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-[var(--dash-text-faint)]">Sentiment</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {intelligence.biggest_movers.sentiment.map((m) => (
                      <li key={m.topic} className="flex items-center gap-1">
                        <TrendingDown className="size-3 text-[var(--dash-neg)]" /> {m.topic} {m.change}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-[var(--dash-text-faint)]">Volume</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {intelligence.biggest_movers.volume.map((m) => (
                      <li key={m.topic} className="flex items-center gap-1">
                        <TrendingUp className="size-3 text-[var(--dash-pos)]" /> {m.topic} {m.change}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Link to="/alerts" className="inline-flex items-center gap-1 rounded-lg border border-[var(--dash-border)] px-3 py-2 text-sm font-medium hover:bg-[var(--dash-surface-alt)]">
          <Plus className="size-4" /> Monitor topic
        </Link>
        <Link to="/search" className="inline-flex items-center gap-1 rounded-lg border border-[var(--dash-border)] px-3 py-2 text-sm font-medium hover:bg-[var(--dash-surface-alt)]">
          Search
        </Link>
        <Link to="/compare" className="inline-flex items-center gap-1 rounded-lg border border-[var(--dash-border)] px-3 py-2 text-sm font-medium hover:bg-[var(--dash-surface-alt)]">
          <BarChart3 className="size-4" /> Compare
        </Link>
        <Link to="/chat" className="inline-flex items-center gap-1 rounded-lg border border-[var(--dash-border)] px-3 py-2 text-sm font-medium hover:bg-[var(--dash-surface-alt)]">
          <Bot className="size-4" /> Ask Pulse
        </Link>
      </div>
    </div>
  )
}
