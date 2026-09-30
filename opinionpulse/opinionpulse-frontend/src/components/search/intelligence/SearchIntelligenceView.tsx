import { useMemo } from "react"
import { Link } from "react-router-dom"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  ExternalLink,
  Flame,
  Play,
  Shield,
  TrendingUp,
} from "lucide-react"
import type { SearchFilters, SearchResponse, SearchTab } from "@/lib/api/types"
import { platformDisplayName, sentimentBadgeClass, sentimentBadgeLabel } from "@/lib/api/sentiment"
import { YouTubeAnalysisPanel } from "@/components/search/YouTubeAnalysisPanel"
import { ResultsFeed } from "@/components/search/ResultsFeed"
import { SourcesStatusBar } from "@/components/search/SourcesStatusBar"
import { TopicSummaryCard } from "@/components/search/TopicSummaryCard"
import { AiInsightsSection } from "@/components/search/AiInsightsSection"
import { SearchSentimentChart } from "@/components/search/SearchSentimentChart"
import { PlatformShareChart } from "@/components/search/PlatformShareChart"
import { PlatformSentimentChart } from "@/components/search/PlatformSentimentChart"
import { SentimentForecastChart } from "@/components/search/SentimentForecastChart"
import { InlineNotice } from "@/components/layout/InlineNotice"
import { proCard, sectionTitle } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

const TABS: { id: SearchTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "platforms", label: "Platforms" },
  { id: "youtube", label: "YouTube" },
  { id: "trends", label: "Trends" },
  { id: "results", label: "Results" },
]

type Props = {
  data: SearchResponse
  filters: SearchFilters
  tab: SearchTab
  onTabChange: (tab: SearchTab) => void
  onPlatformFilter: (platform: string) => void
  onThemeFilter?: (theme: string) => void
  timeLabel: string
}

function SentimentStack({ data }: { data: { positive: number; neutral: number; negative: number } }) {
  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        <div className="bg-emerald-500" style={{ width: `${data.positive}%` }} title={`Positive ${data.positive}%`} />
        <div className="bg-slate-400" style={{ width: `${data.neutral}%` }} title={`Neutral ${data.neutral}%`} />
        <div className="bg-red-500" style={{ width: `${data.negative}%` }} title={`Negative ${data.negative}%`} />
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {data.positive}% pos · {data.neutral}% neu · {data.negative}% neg
      </p>
    </div>
  )
}

function KpiCard({
  label,
  title,
  children,
  hint,
}: {
  label: string
  title: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className={cn(proCard, "p-4")}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{title}</p>
      <div className="mt-2">{children}</div>
      {hint && <p className="mt-2 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function SearchIntelligenceView({
  data,
  filters,
  tab,
  onTabChange,
  onPlatformFilter,
  timeLabel,
}: Props) {
  const intel = data.search_intelligence
  const breakdown = intel?.content_breakdown
  const comparison = intel?.period_comparison

  const dominantSentiment = useMemo(() => {
    const s = data.sentiment_summary
    return Object.entries(s).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "neutral"
  }, [data.sentiment_summary])

  const toneLabel =
    dominantSentiment === "positive"
      ? "Mostly Positive"
      : dominantSentiment === "negative"
        ? "Mostly Negative"
        : "Mostly Neutral"

  return (
    <div className="report-print-area grid w-full grid-cols-1 gap-6 xl:grid-cols-12 xl:gap-8">
      <div className="flex flex-col gap-6 xl:col-span-8 xl:gap-6">
        {/* Intelligence header */}
        <div className={cn(proCard, "p-5 sm:p-6")}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Public Opinion Intelligence
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{data.query}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {timeLabel} · {filters.platform === "all" ? "All platforms" : platformDisplayName(filters.platform)}
                {filters.language === "english" ? " · English" : ""}
              </p>
            </div>
            {intel && (
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-right text-xs">
                <p className="font-semibold text-foreground">
                  Coverage: {intel.confidence.label}
                </p>
                <p className="mt-0.5 max-w-xs text-muted-foreground">{intel.confidence.explanation}</p>
              </div>
            )}
          </div>

          {breakdown && (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                { label: "Primary content", value: breakdown.primary },
                { label: "Comments", value: breakdown.comments },
                { label: "Replies", value: breakdown.replies },
                { label: "Total analyzed", value: breakdown.total },
                { label: "Active sources", value: data.platforms_searched.length },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-muted/40 px-3 py-2">
                  <p className="text-[10px] uppercase text-muted-foreground">{item.label}</p>
                  <p className="text-lg font-semibold tabular-nums">{item.value}</p>
                </div>
              ))}
            </div>
          )}

          {intel && intel.analyzed_total > intel.displayed_count && (
            <p className="mt-3 text-xs text-muted-foreground">
              Showing {intel.displayed_count} of {intel.analyzed_total} analyzed items in Results tab.
            </p>
          )}

          {data.data_freshness?.fetched_at && (
            <p className="mt-2 text-xs text-muted-foreground">
              Updated {new Date(data.data_freshness.fetched_at).toLocaleTimeString()}
              {data.relevance_mode === "strict" ? " · Strict relevance" : ""}
            </p>
          )}
        </div>

        {/* KPI grid */}
        {intel && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Sentiment" title={toneLabel}>
              <SentimentStack data={data.sentiment_summary} />
            </KpiCard>
            <KpiCard
              label="Activity"
              title={`${breakdown?.total ?? data.total_results} content items`}
              hint={
                comparison
                  ? `${comparison.volume_change_pct >= 0 ? "+" : ""}${comparison.volume_change_pct}% vs earlier in period`
                  : "Insufficient history for period comparison"
              }
            >
              <Activity className="size-5 text-primary" />
            </KpiCard>
            <KpiCard
              label="Top source"
              title={platformDisplayName(intel.leading_platform?.platform ?? data.most_active_platform ?? "—")}
            >
              {intel.leading_platform && (
                <p className="text-xs text-muted-foreground">
                  {intel.leading_platform.primary} primary
                  {intel.leading_platform.comments > 0 && ` · ${intel.leading_platform.comments} comments`}
                  {intel.leading_platform.replies > 0 && ` · ${intel.leading_platform.replies} replies`}
                </p>
              )}
            </KpiCard>
            <KpiCard
              label="Momentum"
              title={
                comparison?.momentum === "rising"
                  ? "Rising"
                  : comparison?.momentum === "declining"
                    ? "Declining"
                    : comparison
                      ? "Stable"
                      : "Insufficient data"
              }
            >
              {comparison && (
                <p className="text-xs text-muted-foreground">
                  {comparison.volume_change_pct >= 0 ? "+" : ""}
                  {comparison.volume_change_pct}% conversation volume
                </p>
              )}
            </KpiCard>
          </div>
        )}

        <SourcesStatusBar data={data} />

        {/* Tabs */}
        <div
          className="no-print flex gap-1 overflow-x-auto rounded-xl border border-border bg-muted/30 p-1"
          role="tablist"
          aria-label="Search intelligence sections"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => onTabChange(t.id)}
              className={cn(
                "shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                tab === t.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "overview" && (
          <div className="report-print-section space-y-6" role="tabpanel">
            <TopicSummaryCard data={data} />

            {intel && intel.insights.length > 0 && (
              <div className={cn(proCard, "p-5")}>
                <h3 className={sectionTitle}>What You Should Know</h3>
                <ul className="mt-4 space-y-3">
                  {intel.insights.map((insight, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span
                        className={cn(
                          "mt-1 size-2 shrink-0 rounded-full",
                          insight.severity === "warning" && "bg-amber-500",
                          insight.severity === "positive" && "bg-emerald-500",
                          insight.severity === "critical" && "bg-red-500",
                          insight.severity === "info" && "bg-primary"
                        )}
                      />
                      <div>
                        <p className="font-medium text-foreground">{insight.title}</p>
                        <p className="text-muted-foreground">{insight.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {intel && intel.themes.length > 0 && (
              <div className={cn(proCard, "p-5")}>
                <h3 className={sectionTitle}>Top Themes</h3>
                <div className="mt-4 space-y-3">
                  {intel.themes.slice(0, 8).map((theme) => (
                    <div key={theme.label} className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 last:border-0">
                      <div>
                        <p className="font-medium">{theme.label}</p>
                        <p className="text-xs text-muted-foreground">{theme.mentions} mentions</p>
                      </div>
                      <div className="min-w-[140px]">
                        <SentimentStack data={theme.sentiment} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <PlatformShareChart data={data} />
              <PlatformSentimentChart data={data} />
            </div>

            {intel && intel.influential_content.length > 0 && (
              <div className={cn(proCard, "p-5")}>
                <h3 className={sectionTitle}>Most Influential Content</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ranked by normalized engagement, relevance, and recency within each platform.
                </p>
                <ul className="mt-4 space-y-3">
                  {intel.influential_content.slice(0, 5).map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                          {platformDisplayName(item.platform)} · {item.content_type ?? "post"}
                        </p>
                        <p className="truncate font-medium">{item.title || item.content.slice(0, 80)}</p>
                        <span className={cn("mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold", sentimentBadgeClass(item.sentiment))}>
                          {sentimentBadgeLabel(item.sentiment)}
                        </span>
                      </div>
                      <a
                        href={item.source_url || item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-primary hover:underline"
                      >
                        <ExternalLink className="size-4" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.risk_assessment && data.sentiment_summary.negative >= 25 && (
              <div className={cn(proCard, "border-l-4 border-l-amber-500 p-5")}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-2 font-semibold">
                      <Shield className="size-4" /> Reputation Risk — {data.risk_assessment.label}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">{data.risk_assessment.description}</p>
                    {data.risk_assessment.risk_factors.length > 0 && (
                      <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
                        {data.risk_assessment.risk_factors.slice(0, 4).map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <Link
                    to={`/crisis?watch=${encodeURIComponent(data.query)}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    Open Crisis Radar <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            )}

            <div className="no-print">
              <AiInsightsSection data={data} timeRange={filters.timeRange} />
            </div>

            {intel && intel.confidence.level === "low" && (
              <InlineNotice variant="warning" title="Limited data">
                Only {intel.confidence.total_items} relevant items were found. Sentiment and trend metrics may not
                be representative.
              </InlineNotice>
            )}

            <details className={cn(proCard, "no-print p-4 text-sm")}>
              <summary className="cursor-pointer font-medium text-foreground">How this analysis works</summary>
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-muted-foreground">
                <li>OpinionPulse fetches public content from supported sources.</li>
                <li>Results are relevance-filtered; spam and duplicates are removed.</li>
                <li>Text is analyzed for sentiment and aggregated by platform and theme.</li>
                <li>YouTube videos, comments, and replies are sampled per API limits.</li>
                <li>Some APIs return partial or time-limited samples — see source health for status.</li>
              </ol>
            </details>
          </div>
        )}

        {tab === "platforms" && intel && (
          <div className={cn(proCard, "overflow-x-auto p-5")}>
            <h3 className={sectionTitle}>Platform Performance</h3>
            <p className="mt-1 text-xs text-muted-foreground">Share of analyzed content by platform</p>
            <table className="mt-4 w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4">Platform</th>
                  <th className="pb-2 pr-4">Content</th>
                  <th className="pb-2 pr-4">Share</th>
                  <th className="pb-2 pr-4">Positive</th>
                  <th className="pb-2 pr-4">Neutral</th>
                  <th className="pb-2 pr-4">Negative</th>
                  <th className="pb-2">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {intel.platform_stats.map((p) => (
                  <tr
                    key={p.platform}
                    className="cursor-pointer border-b border-border/60 hover:bg-muted/30"
                    onClick={() => onPlatformFilter(p.platform)}
                  >
                    <td className="py-2.5 pr-4 font-medium">{platformDisplayName(p.platform)}</td>
                    <td className="py-2.5 pr-4 tabular-nums">{p.content_count}</td>
                    <td className="py-2.5 pr-4 tabular-nums">{p.share_pct}%</td>
                    <td className="py-2.5 pr-4 tabular-nums">{p.sentiment.positive}%</td>
                    <td className="py-2.5 pr-4 tabular-nums">{p.sentiment.neutral}%</td>
                    <td className="py-2.5 pr-4 tabular-nums">{p.sentiment.negative}%</td>
                    <td className="py-2.5 capitalize">{p.engagement_level === "none" ? "N/A" : p.engagement_level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "youtube" && (
          <div className="space-y-6">
            {data.youtube_summary ? (
              <YouTubeAnalysisPanel summary={data.youtube_summary} />
            ) : (
              <InlineNotice variant="info">
                No YouTube data for this search. Try &ldquo;All platforms&rdquo; or verify YOUTUBE_API_KEY is configured.
              </InlineNotice>
            )}
            {data.results.filter((r) => r.platform === "youtube").length > 0 && (
              <ResultsFeed results={data.results.filter((r) => r.platform === "youtube")} />
            )}
          </div>
        )}

        {tab === "trends" && (
          <div className="space-y-6" role="tabpanel">
            <SearchSentimentChart data={data} />
            {intel && intel.confidence.level !== "low" && <SentimentForecastChart data={data} />}
            {intel && intel.confidence.level === "low" && (
              <InlineNotice variant="info">
                Outlook hidden — sample size too small for a reliable projection.
              </InlineNotice>
            )}

            {intel && intel.emerging_topics.length > 0 ? (
              <div className={cn(proCard, "p-5")}>
                <h3 className="flex items-center gap-2 sectionTitle">
                  <Flame className="size-4 text-orange-500" /> Emerging Conversations
                </h3>
                <ul className="mt-4 space-y-2">
                  {intel.emerging_topics.map((t) => (
                    <li key={t.label} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm">
                      <span className="font-medium">{t.label}</span>
                      <span className={cn("tabular-nums", t.growth_pct >= 0 ? "text-emerald-600" : "text-red-600")}>
                        {t.growth_pct >= 0 ? "+" : ""}
                        {t.growth_pct}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <InlineNotice variant="info">
                Not enough historical data in this search to calculate emerging conversations.
              </InlineNotice>
            )}

            {intel?.why_sentiment_changed && (
              <div className={cn(proCard, "p-5")}>
                <h3 className={sectionTitle}>Why Sentiment Changed</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Negative sentiment {intel.why_sentiment_changed.previous_negative_pct}% →{" "}
                  {intel.why_sentiment_changed.current_negative_pct}%
                  ({intel.why_sentiment_changed.negative_change_pp >= 0 ? "+" : ""}
                  {intel.why_sentiment_changed.negative_change_pp} pp)
                </p>
                {intel.why_sentiment_changed.negative_contributors.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Main negative themes</p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {intel.why_sentiment_changed.negative_contributors.map((t) => (
                        <li key={t.label}>
                          {t.label} — {t.negative_pct}% negative ({t.mentions} mentions)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <Link
                  to={`/chat?q=${encodeURIComponent(`Why is sentiment changing for ${data.query}?`)}`}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  <Bot className="size-4" /> Ask Pulse AI about this
                </Link>
              </div>
            )}
          </div>
        )}

        {tab === "results" && (
          <div className="space-y-4">
            {filters.sentiment !== "all" && (
              <InlineNotice variant="info">
                Results filtered to <strong>{filters.sentiment}</strong> sentiment. Analytics above reflect all
                analyzed content.
              </InlineNotice>
            )}
            <ResultsFeed results={data.results} />
          </div>
        )}
      </div>

      {/* Insight rail */}
      <div className="xl:col-span-4">
        <div className="sticky top-[76px] flex flex-col gap-4">
          <div className={cn(proCard, "p-4")}>
            <h3 className="text-sm font-semibold">Live Insights</h3>
            <div className="mt-3 space-y-3 text-sm">
              {intel?.most_negative_theme && (
                <div className="rounded-lg bg-red-500/5 px-3 py-2">
                  <p className="text-xs font-semibold text-red-600">Main concern</p>
                  <p className="font-medium">{intel.most_negative_theme.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {intel.most_negative_theme.sentiment.negative}% negative
                  </p>
                </div>
              )}
              {intel?.most_positive_theme && (
                <div className="rounded-lg bg-emerald-500/5 px-3 py-2">
                  <p className="text-xs font-semibold text-emerald-600">Most positive theme</p>
                  <p className="font-medium">{intel.most_positive_theme.label}</p>
                </div>
              )}
              {intel?.leading_platform && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Play className="size-4 shrink-0" />
                  <span>
                    Most active: <strong className="text-foreground">{platformDisplayName(intel.leading_platform.platform)}</strong>
                  </span>
                </div>
              )}
              {comparison && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="size-4 shrink-0" />
                  <span>
                    Momentum:{" "}
                    <strong className="text-foreground capitalize">{comparison.momentum}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {data.related_topics.length > 0 && (
            <div className={cn(proCard, "p-4")}>
              <h3 className="text-sm font-semibold">Related Topics</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {data.related_topics.slice(0, 8).map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs font-medium"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className={cn(proCard, "p-4")}>
            <h3 className="text-sm font-semibold">Quick Actions</h3>
            <div className="mt-3 flex flex-col gap-2">
              <Link
                to={`/compare?a=${encodeURIComponent(data.query)}`}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/40"
              >
                <BarChart3 className="size-4" /> Compare this topic
              </Link>
              <Link
                to={`/alerts`}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/40"
              >
                <AlertTriangle className="size-4" /> Monitor in Brand Watch
              </Link>
              <Link
                to={`/chat?q=${encodeURIComponent(data.query)}`}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/40"
              >
                <Bot className="size-4" /> Ask Pulse AI
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
