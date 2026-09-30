import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { CircleHelp, GitCompare } from "lucide-react"
import { CompareControls } from "@/components/compare/CompareControls"
import { CompareLoadingSkeleton } from "@/components/compare/CompareLoadingSkeleton"
import {
  PlatformComparisonPanel,
  SentimentComparisonPanel,
  SourcesCoveragePanel,
  ThemesComparisonPanel,
  TrendsComparisonPanel,
} from "@/components/compare/CompareTabPanels"
import { ComparisonScoreboard } from "@/components/compare/ComparisonScoreboard"
import { ComparisonVerdict } from "@/components/compare/ComparisonVerdict"
import { TopicIdentityCard } from "@/components/compare/TopicIdentityCard"
import { TopicContextAccordion } from "@/components/compare/TopicContextAccordion"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { EmptyState } from "@/components/layout/EmptyState"
import { InlineNotice } from "@/components/layout/InlineNotice"
import {
  COMPARE_TABS,
  activeSourceCount,
  analyzedTotal,
  buildScoreboard,
  contentBreakdown,
  formatRelativeUpdated,
  topicLabel,
  type CompareTab,
} from "@/lib/compare-analytics"
import { searchOpinions } from "@/lib/api/search"
import type { SearchResponse } from "@/lib/api/types"
import { addRecentSearch } from "@/lib/recentSearchStorage"
import { proCard } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"
import "@/styles/compare.css"

const TIME_RANGE = "7d" as const

export function ComparePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [queryA, setQueryA] = useState(searchParams.get("a") ?? "")
  const [queryB, setQueryB] = useState(searchParams.get("b") ?? "")
  const [tab, setTab] = useState<CompareTab>(
    (searchParams.get("tab") as CompareTab) || "overview"
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dataA, setDataA] = useState<SearchResponse | null>(null)
  const [dataB, setDataB] = useState<SearchResponse | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)

  const runCompare = useCallback(async (a: string, b: string) => {
    const qA = a.trim()
    const qB = b.trim()
    if (qA.length < 2 || qB.length < 2) return

    setLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      const filters = {
        platform: "all" as const,
        timeRange: TIME_RANGE,
        sentiment: "all" as const,
        sortBy: "recent" as const,
        language: "all" as const,
      }
      const resA = await searchOpinions(qA, filters)
      const resB = await searchOpinions(qB, filters)
      setDataA(resA)
      setDataB(resB)
      addRecentSearch(qA)
      addRecentSearch(qB)
      setSearchParams({ a: qA, b: qB, tab }, { replace: true })
    } catch {
      setError("Couldn't load results for comparison.")
      setDataA(null)
      setDataB(null)
    } finally {
      setLoading(false)
    }
  }, [setSearchParams, tab])

  useEffect(() => {
    const a = searchParams.get("a")
    const b = searchParams.get("b")
    const t = searchParams.get("tab") as CompareTab | null
    if (a) setQueryA(a)
    if (b) setQueryB(b)
    if (t && COMPARE_TABS.some((x) => x.id === t)) setTab(t)
    if (a && b && a.length >= 2 && b.length >= 2 && !hasSearched && !dataA) {
      void runCompare(a, b)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleTabChange(next: CompareTab) {
    setTab(next)
    if (queryA && queryB) {
      setSearchParams({ a: queryA, b: queryB, tab: next }, { replace: true })
    }
  }

  function handleSwap() {
    setQueryA(queryB)
    setQueryB(queryA)
    if (dataA && dataB) {
      setDataA(dataB)
      setDataB(dataA)
      setSearchParams({ a: queryB, b: queryA, tab }, { replace: true })
    }
  }

  function handleClear() {
    setQueryA("")
    setQueryB("")
    setDataA(null)
    setDataB(null)
    setHasSearched(false)
    setError(null)
    setSearchParams({}, { replace: true })
  }

  function copyShareLink() {
    const url = `${window.location.origin}/compare?a=${encodeURIComponent(queryA)}&b=${encodeURIComponent(queryB)}&tab=${tab}`
    void navigator.clipboard.writeText(url)
  }

  const nameA = dataA ? topicLabel(dataA) : queryA
  const nameB = dataB ? topicLabel(dataB) : queryB

  const scoreboard = useMemo(() => {
    if (!dataA || !dataB) return []
    return buildScoreboard(dataA, dataB, nameA, nameB)
  }, [dataA, dataB, nameA, nameB])

  const showResults = hasSearched && (loading || (dataA && dataB) || error)

  return (
    <DashboardLayout title="Compare Topics" subtitle="Competitive public-opinion intelligence">
      <div className="compare-page mx-auto flex w-full max-w-7xl flex-col gap-5">
        <section className={cn(proCard, "p-5 sm:p-6", !showResults && "py-8")}>
          {!showResults && (
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-[var(--dash-accent-soft)]">
                <GitCompare className="size-6 text-[var(--dash-accent)]" />
              </div>
              <h2 className="compare-page-title">Compare Topics</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-[var(--dash-text-mid)]">
                See exactly how two topics differ — volume, sentiment, platforms, and themes.
              </p>
            </div>
          )}

          {showResults && dataA && dataB && !loading && (
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="compare-page-title m-0">
                  {nameA}{" "}
                  <span className="text-[var(--dash-text-faint)] font-normal">vs</span> {nameB}
                </h2>
                <p className="mt-1 text-xs text-[var(--dash-text-faint)]">
                  Last 7 days · {Math.max(activeSourceCount(dataA), activeSourceCount(dataB))} sources
                  · Updated {formatRelativeUpdated(dataA.last_updated)}
                </p>
              </div>
              <button
                type="button"
                className="compare-no-print inline-flex items-center gap-1 text-xs text-[var(--dash-text-mid)] hover:text-[var(--dash-accent)]"
                onClick={() => setInfoOpen((v) => !v)}
              >
                <CircleHelp className="size-3.5" />
                How comparison works
              </button>
            </div>
          )}

          {infoOpen && (
            <p className="mb-4 rounded-lg border border-[var(--dash-border)] bg-[var(--dash-bg)] px-3 py-2 text-xs text-[var(--dash-text-mid)]">
              OpinionPulse compares sampled content from supported sources over the selected period.
              Metrics include conversation volume, sentiment, platform mix, themes, and momentum.
              Conclusions use deterministic rules — not unsupported product recommendations.
            </p>
          )}

          <CompareControls
            queryA={queryA}
            queryB={queryB}
            loading={loading}
            onChangeA={setQueryA}
            onChangeB={setQueryB}
            onSwap={handleSwap}
            onClear={handleClear}
            onSubmit={() => void runCompare(queryA, queryB)}
            compact={Boolean(showResults)}
          />
        </section>

        {error && (
          <InlineNotice variant="warning">{error}</InlineNotice>
        )}

        {loading && (
          <div>
            <p className="mb-3 text-center text-sm text-[var(--dash-text-mid)]">
              Comparing <strong>{queryA}</strong> and <strong>{queryB}</strong>…
            </p>
            <CompareLoadingSkeleton />
          </div>
        )}

        {!loading && !error && dataA && dataB && (
          <>
            <section className={cn(proCard, "grid gap-4 p-5 sm:grid-cols-2 sm:p-6")}>
              <div className="text-center sm:text-left">
                <p className="text-lg font-bold text-indigo-600">{nameA}</p>
                <p className="text-2xl font-bold tabular-nums">{analyzedTotal(dataA)}</p>
                <p className="text-xs text-[var(--dash-text-faint)]">analyzed items</p>
              </div>
              <div className="text-center sm:text-right">
                <p className="text-lg font-bold text-orange-600">{nameB}</p>
                <p className="text-2xl font-bold tabular-nums">{analyzedTotal(dataB)}</p>
                <p className="text-xs text-[var(--dash-text-faint)]">analyzed items</p>
              </div>
              {(() => {
                const bA = contentBreakdown(dataA)
                const bB = contentBreakdown(dataB)
                const total = bA.total + bB.total
                if (bA.comments + bB.comments <= 0) return null
                return (
                  <p className="sm:col-span-2 text-center text-xs text-[var(--dash-text-faint)]">
                    Combined · Primary {bA.primary + bB.primary} · Audience comments{" "}
                    {bA.comments + bB.comments} · Total analyzed {total}
                  </p>
                )
              })()}
            </section>

            <ComparisonScoreboard nameA={nameA} nameB={nameB} rows={scoreboard} />
            <ComparisonVerdict
              dataA={dataA}
              dataB={dataB}
              nameA={nameA}
              nameB={nameB}
              onCopyLink={copyShareLink}
            />

            <div className={cn(proCard, "compare-sticky-bar compare-no-print px-2 pt-2")}>
              <div className="compare-tab-bar" role="tablist">
                {COMPARE_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.id}
                    className={cn("compare-tab", tab === t.id && "compare-tab-active")}
                    onClick={() => handleTabChange(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {tab === "overview" && (
              <div className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="order-1">
                    <TopicIdentityCard data={dataA} name={nameA} side="a" />
                  </div>
                  <div className="order-3 md:order-2">
                    <TopicIdentityCard data={dataB} name={nameB} side="b" />
                  </div>
                  <div className="order-2 md:order-3 md:col-span-2">
                    <TopicContextAccordion data={dataA} name={nameA} />
                  </div>
                  <div className="order-4 md:col-span-2">
                    <TopicContextAccordion data={dataB} name={nameB} />
                  </div>
                </div>
                <SentimentComparisonPanel dataA={dataA} dataB={dataB} nameA={nameA} nameB={nameB} />
              </div>
            )}

            {tab === "sentiment" && (
              <SentimentComparisonPanel dataA={dataA} dataB={dataB} nameA={nameA} nameB={nameB} />
            )}

            {tab === "platforms" && (
              <PlatformComparisonPanel dataA={dataA} dataB={dataB} nameA={nameA} nameB={nameB} />
            )}

            {tab === "themes" && (
              <ThemesComparisonPanel dataA={dataA} dataB={dataB} nameA={nameA} nameB={nameB} />
            )}

            {tab === "trends" && (
              <TrendsComparisonPanel dataA={dataA} dataB={dataB} nameA={nameA} nameB={nameB} />
            )}

            {tab === "sources" && (
              <SourcesCoveragePanel dataA={dataA} dataB={dataB} nameA={nameA} nameB={nameB} />
            )}
          </>
        )}

        {!loading && !error && !dataA && !hasSearched && (
          <EmptyState
            icon={GitCompare}
            title="Enter two topics to compare"
            description="See a head-to-head breakdown of conversation volume, sentiment, platforms, and themes."
            compact
          />
        )}
      </div>
    </DashboardLayout>
  )
}
