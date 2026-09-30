import type { SearchResponse } from "@/lib/api/types"
import { platformDisplayName } from "@/lib/api/sentiment"
import {
  buildSentimentVerdict,
  differentiatingThemes,
  getThemes,
  peakActivity,
  platformStatsForCompare,
  sentimentDifference,
  sentimentPct,
  sharedThemes,
} from "@/lib/compare-analytics"
import { proCard } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

function SentimentStackBar({
  data,
  label,
  accentClass,
}: {
  data: SearchResponse
  label: string
  accentClass: string
}) {
  const pos = sentimentPct(data, "positive")
  const neu = sentimentPct(data, "neutral")
  const neg = sentimentPct(data, "negative")

  return (
    <div className="space-y-2">
      <p className={cn("text-sm font-semibold", accentClass)}>{label}</p>
      <div className="compare-sentiment-bar">
        {pos > 0 && <div className="compare-sentiment-seg-pos" style={{ width: `${pos}%` }} />}
        {neu > 0 && <div className="compare-sentiment-seg-neu" style={{ width: `${neu}%` }} />}
        {neg > 0 && <div className="compare-sentiment-seg-neg" style={{ width: `${neg}%` }} />}
      </div>
      <div className="flex justify-between text-[11px] text-[var(--dash-text-faint)]">
        <span className="text-emerald-600">+{pos}%</span>
        <span>{neu}% neutral</span>
        <span className="text-red-600">−{neg}%</span>
      </div>
    </div>
  )
}

export function SentimentComparisonPanel({
  dataA,
  dataB,
  nameA,
  nameB,
}: {
  dataA: SearchResponse
  dataB: SearchResponse
  nameA: string
  nameB: string
}) {
  const diffs = sentimentDifference(dataA, dataB)
  const verdict = buildSentimentVerdict(dataA, dataB, nameA, nameB)

  return (
    <div className="space-y-5">
      <section className={cn(proCard, "p-5 sm:p-6")}>
        <h3 className="compare-section-label m-0">Sentiment comparison</h3>
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <SentimentStackBar data={dataA} label={nameA} accentClass="text-indigo-600" />
          <SentimentStackBar data={dataB} label={nameB} accentClass="text-orange-600" />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {diffs.map((d) => (
            <span key={d.key} className="compare-theme-chip text-xs">
              {d.key}: {Math.abs(d.diffPp) < 3 ? "≈ similar" : `${d.diffPp > 0 ? "+" : ""}${d.diffPp} pp`}
            </span>
          ))}
        </div>
      </section>
      <section className={cn(proCard, "p-5 sm:p-6")}>
        <h3 className="compare-section-label m-0">Sentiment verdict</h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--dash-text-mid)]">{verdict}</p>
      </section>
    </div>
  )
}

export function PlatformComparisonPanel({
  dataA,
  dataB,
  nameA,
  nameB,
}: {
  dataA: SearchResponse
  dataB: SearchResponse
  nameA: string
  nameB: string
}) {
  const statsA = platformStatsForCompare(dataA)
  const statsB = platformStatsForCompare(dataB)
  const platforms = [...new Set([...statsA.map((s) => s.platform), ...statsB.map((s) => s.platform)])]

  if (!platforms.length) {
    return (
      <section className={cn(proCard, "p-6 text-sm text-[var(--dash-text-faint)]")}>
        Platform distribution unavailable for this comparison.
      </section>
    )
  }

  const mapA = Object.fromEntries(statsA.map((s) => [s.platform, s.share_pct]))
  const mapB = Object.fromEntries(statsB.map((s) => [s.platform, s.share_pct]))

  const leadsA: string[] = []
  const leadsB: string[] = []
  platforms.forEach((p) => {
    const a = mapA[p] ?? 0
    const b = mapB[p] ?? 0
    if (a - b >= 8) leadsA.push(platformDisplayName(p))
    if (b - a >= 8) leadsB.push(platformDisplayName(p))
  })

  return (
    <div className="space-y-5">
      <section className={cn(proCard, "p-5 sm:p-6")}>
        <h3 className="compare-section-label m-0">Platform breakdown</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[320px] text-sm">
            <thead>
              <tr className="border-b border-[var(--dash-border)] text-left text-xs uppercase tracking-wide text-[var(--dash-text-faint)]">
                <th className="pb-2 pr-4">Platform</th>
                <th className="pb-2 pr-4 text-indigo-600">{nameA}</th>
                <th className="pb-2 text-orange-600">{nameB}</th>
              </tr>
            </thead>
            <tbody>
              {platforms.map((p) => (
                <tr key={p} className="border-b border-[var(--dash-border)] last:border-0">
                  <td className="py-2 pr-4 font-medium">{platformDisplayName(p)}</td>
                  <td className="py-2 pr-4 tabular-nums">{mapA[p] ?? 0}%</td>
                  <td className="py-2 tabular-nums">{mapB[p] ?? 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {(leadsA.length > 0 || leadsB.length > 0) && (
        <section className={cn(proCard, "p-5 sm:p-6")}>
          <h3 className="compare-section-label m-0">Platform leadership</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {leadsA.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-indigo-600">{nameA} leads on</p>
                <ul className="mt-1 list-inside list-disc text-sm text-[var(--dash-text-mid)]">
                  {leadsA.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
            {leadsB.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-orange-600">{nameB} leads on</p>
                <ul className="mt-1 list-inside list-disc text-sm text-[var(--dash-text-mid)]">
                  {leadsB.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <SourceDistributionCard name={nameA} stats={statsA} accent="indigo" />
        <SourceDistributionCard name={nameB} stats={statsB} accent="orange" />
      </div>
    </div>
  )
}

function SourceDistributionCard({
  name,
  stats,
  accent,
}: {
  name: string
  stats: ReturnType<typeof platformStatsForCompare>
  accent: "indigo" | "orange"
}) {
  return (
    <section className={cn(proCard, "p-5")}>
      <h4 className={cn("text-sm font-semibold", accent === "indigo" ? "text-indigo-600" : "text-orange-600")}>
        {name} — source distribution
      </h4>
      <ul className="mt-3 space-y-2">
        {stats.slice(0, 8).map((s) => (
          <li key={s.platform}>
            <div className="mb-1 flex justify-between text-xs">
              <span>{platformDisplayName(s.platform)}</span>
              <span className="tabular-nums">{s.share_pct}%</span>
            </div>
            <div className="compare-platform-bar">
              <div
                className={cn("h-full rounded-full", accent === "indigo" ? "bg-indigo-500" : "bg-orange-500")}
                style={{ width: `${Math.max(s.share_pct, 2)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function ThemesComparisonPanel({
  dataA,
  dataB,
  nameA,
  nameB,
}: {
  dataA: SearchResponse
  dataB: SearchResponse
  nameA: string
  nameB: string
}) {
  const themesA = getThemes(dataA, nameA)
  const themesB = getThemes(dataB, nameB)
  const shared = sharedThemes(dataA, dataB, nameA, nameB)
  const diffA = differentiatingThemes(dataA, dataB, nameA, nameB)
  const diffB = differentiatingThemes(dataB, dataA, nameB, nameA)

  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <ThemeList title={`${nameA} themes`} themes={themesA} accent="indigo" />
        <ThemeList title={`${nameB} themes`} themes={themesB} accent="orange" />
      </div>

      {shared.length > 0 && (
        <section className={cn(proCard, "p-5")}>
          <h3 className="compare-section-label m-0">Shared conversations</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {shared.map((t) => (
              <span key={t} className="compare-theme-chip">
                {t}
              </span>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <Differentiators title={`What differentiates ${nameA}?`} themes={diffA} accent="indigo" />
        <Differentiators title={`What differentiates ${nameB}?`} themes={diffB} accent="orange" />
      </div>

      <ThemeSentimentHighlights dataA={dataA} dataB={dataB} nameA={nameA} nameB={nameB} />
    </div>
  )
}

function ThemeList({
  title,
  themes,
  accent,
}: {
  title: string
  themes: ReturnType<typeof getThemes>
  accent: "indigo" | "orange"
}) {
  if (!themes.length) {
    return (
      <section className={cn(proCard, "p-5 text-sm text-[var(--dash-text-faint)]")}>
        No themes extracted for this topic yet.
      </section>
    )
  }
  return (
    <section className={cn(proCard, "p-5")}>
      <h3 className={cn("compare-section-label", accent === "indigo" ? "text-indigo-600" : "text-orange-600")}>
        {title}
      </h3>
      <ul className="mt-3 space-y-2">
        {themes.slice(0, 6).map((t) => (
          <li key={t.label} className="flex items-center justify-between text-sm">
            <span className="font-medium">{t.label}</span>
            <span className="text-xs text-[var(--dash-text-faint)]">{t.mentions ?? t.count} mentions</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Differentiators({
  title,
  themes,
  accent,
}: {
  title: string
  themes: ReturnType<typeof getThemes>
  accent: "indigo" | "orange"
}) {
  if (!themes.length) return null
  return (
    <section className={cn(proCard, "p-5")}>
      <h3 className="compare-section-label">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {themes.map((t) => (
          <span
            key={t.label}
            className={cn(
              "compare-theme-chip",
              accent === "indigo" ? "border-indigo-500/30" : "border-orange-500/30"
            )}
          >
            #{t.label.toLowerCase().replace(/\s+/g, "-")}
          </span>
        ))}
      </div>
    </section>
  )
}

function ThemeSentimentHighlights({
  dataA,
  dataB,
  nameA,
  nameB,
}: {
  dataA: SearchResponse
  dataB: SearchResponse
  nameA: string
  nameB: string
}) {
  const posA = dataA.search_intelligence?.most_positive_theme
  const negA = dataA.search_intelligence?.most_negative_theme
  const posB = dataB.search_intelligence?.most_positive_theme
  const negB = dataB.search_intelligence?.most_negative_theme

  if (!posA && !negA && !posB && !negB) return null

  return (
    <section className={cn(proCard, "p-5 sm:p-6")}>
      <h3 className="compare-section-label m-0">Theme sentiment highlights</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {[posA, negA].filter(Boolean).map((t) =>
          t ? (
            <div key={`a-${t.label}`} className="rounded-lg border border-[var(--dash-border)] p-3 text-sm">
              <p className="text-indigo-600 font-semibold">{nameA}</p>
              <p className="font-medium">{t.label}</p>
              <p className="text-xs text-[var(--dash-text-faint)]">
                {t.sentiment.positive}% pos · {t.sentiment.negative}% neg · {t.mentions} mentions
              </p>
            </div>
          ) : null
        )}
        {[posB, negB].filter(Boolean).map((t) =>
          t ? (
            <div key={`b-${t.label}`} className="rounded-lg border border-[var(--dash-border)] p-3 text-sm">
              <p className="text-orange-600 font-semibold">{nameB}</p>
              <p className="font-medium">{t.label}</p>
              <p className="text-xs text-[var(--dash-text-faint)]">
                {t.sentiment.positive}% pos · {t.sentiment.negative}% neg · {t.mentions} mentions
              </p>
            </div>
          ) : null
        )}
      </div>
    </section>
  )
}

export function TrendsComparisonPanel({
  dataA,
  dataB,
  nameA,
  nameB,
}: {
  dataA: SearchResponse
  dataB: SearchResponse
  nameA: string
  nameB: string
}) {
  const trendA = dataA.sentiment_trend ?? []
  const trendB = dataB.sentiment_trend ?? []
  const merged = trendA.map((p, i) => ({
    time: p.time,
    volumeA: p.volume ?? 0,
    volumeB: trendB[i]?.volume ?? 0,
    negA: p.negative,
    negB: trendB[i]?.negative ?? 0,
  }))

  const peakA = peakActivity(dataA)
  const peakB = peakActivity(dataB)
  const momA = dataA.search_intelligence?.period_comparison
  const momB = dataB.search_intelligence?.period_comparison

  return (
    <div className="space-y-5">
      {merged.length > 0 ? (
        <section className={cn(proCard, "p-5 sm:p-6")}>
          <h3 className="compare-section-label m-0">Conversation volume trend</h3>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={merged}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--dash-border)" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={32} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="volumeA" name={nameA} stroke="#6366f1" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="volumeB" name={nameB} stroke="#ea580c" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      ) : (
        <section className={cn(proCard, "p-5 text-sm text-[var(--dash-text-faint)]")}>
          Historical trend comparison unavailable for this period.
        </section>
      )}

      <section className={cn(proCard, "p-5 sm:p-6")}>
        <h3 className="compare-section-label m-0">Peak activity</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-indigo-600">{nameA}</p>
            <p className="text-sm text-[var(--dash-text-mid)]">{peakA.label}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-orange-600">{nameB}</p>
            <p className="text-sm text-[var(--dash-text-mid)]">{peakB.label}</p>
          </div>
        </div>
      </section>

      {(momA || momB) && (
        <section className={cn(proCard, "p-5 sm:p-6")}>
          <h3 className="compare-section-label m-0">Momentum</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <p className="font-semibold text-indigo-600">{nameA}</p>
              <p>
                {momA
                  ? `${momA.volume_change_pct > 0 ? "+" : ""}${Math.round(momA.volume_change_pct)}% volume · ${momA.momentum}`
                  : "Historical comparison unavailable"}
              </p>
            </div>
            <div>
              <p className="font-semibold text-orange-600">{nameB}</p>
              <p>
                {momB
                  ? `${momB.volume_change_pct > 0 ? "+" : ""}${Math.round(momB.volume_change_pct)}% volume · ${momB.momentum}`
                  : "Historical comparison unavailable"}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export function SourcesCoveragePanel({
  dataA,
  dataB,
  nameA,
  nameB,
}: {
  dataA: SearchResponse
  dataB: SearchResponse
  nameA: string
  nameB: string
}) {
  const sources = [
    ...new Set([...(dataA.platforms_searched ?? []), ...(dataB.platforms_searched ?? [])]),
  ].sort()

  const healthA = dataA.source_health ?? {}
  const healthB = dataB.source_health ?? {}

  const partialErrors = [...(dataA.errors ?? []), ...(dataB.errors ?? [])]

  return (
    <div className="space-y-5">
      <section className={cn(proCard, "p-5 sm:p-6 overflow-x-auto")}>
        <h3 className="compare-section-label m-0">Source coverage</h3>
        <table className="mt-4 w-full min-w-[280px] text-sm">
          <thead>
            <tr className="border-b border-[var(--dash-border)] text-xs uppercase text-[var(--dash-text-faint)]">
              <th className="pb-2 text-left">Source</th>
              <th className="pb-2 text-center text-indigo-600">{nameA}</th>
              <th className="pb-2 text-center text-orange-600">{nameB}</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => {
              const okA = healthA[s]?.status === "ok" || (healthA[s]?.count ?? 0) > 0
              const okB = healthB[s]?.status === "ok" || (healthB[s]?.count ?? 0) > 0
              return (
                <tr key={s} className="border-b border-[var(--dash-border)] last:border-0">
                  <td className="py-2">{platformDisplayName(s)}</td>
                  <td className="py-2 text-center">{okA ? "✓" : "—"}</td>
                  <td className="py-2 text-center">{okB ? "✓" : "—"}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      {partialErrors.length > 0 && (
        <section className={cn(proCard, "border-amber-500/30 bg-amber-500/5 p-4 text-sm")}>
          <p className="font-semibold text-amber-800 dark:text-amber-300">Partial comparison</p>
          <ul className="mt-2 list-inside list-disc text-[var(--dash-text-mid)]">
            {partialErrors.slice(0, 4).map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
