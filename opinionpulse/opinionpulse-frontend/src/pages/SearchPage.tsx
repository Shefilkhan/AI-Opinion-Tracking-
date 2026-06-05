import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Info, Loader2, Search, Sparkles } from "lucide-react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import {
  ParticleBackground,
  type ParticleSentiment,
} from "@/components/ui/ParticleBackground"
import { pageShellParticles, proCard, btnPrimary } from "@/lib/ui-classes"
import { Button } from "@/components/ui/button"
import { KeywordsSidebar } from "@/components/search/KeywordsSidebar"
import { AiInsightsSection } from "@/components/search/AiInsightsSection"
import { OpinionSummaryCard } from "@/components/search/OpinionSummaryCard"
import { ResultsFeed } from "@/components/search/ResultsFeed"
import { SearchFiltersBar } from "@/components/search/SearchFiltersBar"
import { SourcesStatusBar } from "@/components/search/SourcesStatusBar"
import { WikipediaSummaryCard } from "@/components/search/WikipediaSummaryCard"
import { SearchSentimentChart } from "@/components/search/SearchSentimentChart"
import { searchOpinions } from "@/lib/api/search"
import type { SearchFilters, SearchResponse } from "@/lib/api/types"
import { addRecentSearch } from "@/lib/recentSearchStorage"
import { cn } from "@/lib/utils"

const DEFAULT_FILTERS: SearchFilters = {
  platform: "all",
  timeRange: "24h",
  sentiment: "all",
  sortBy: "recent",
}

const QUICK_SEARCHES = [
  { label: "AI & Technology", query: "Artificial Intelligence", emoji: "🔥" },
  { label: "Climate Change", query: "Climate Change", emoji: "🌍" },
  { label: "Crypto & Bitcoin", query: "Bitcoin", emoji: "💰" },
  { label: "Politics", query: "Elections", emoji: "🗳️" },
]

const TIME_LABELS: Record<string, string> = {
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
}

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQ = searchParams.get("q") ?? ""
  const [query, setQuery] = useState(initialQ)
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<SearchResponse | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const runSearch = useCallback(
    async (q: string, f: SearchFilters = filters) => {
      const trimmed = q.trim()
      if (trimmed.length < 2) return
      setLoading(true)
      setError(null)
      setSearchParams({ q: trimmed })
      try {
        const res = await searchOpinions(trimmed, f)
        setData(res)
        addRecentSearch(trimmed)
        setHasSearched(true)
      } catch {
        setError("Couldn't load results")
        setData(null)
      } finally {
        setLoading(false)
      }
    },
    [filters, setSearchParams]
  )

  useEffect(() => {
    if (initialQ.trim().length >= 2) {
      runSearch(initialQ, DEFAULT_FILTERS)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!hasSearched || query.trim().length < 2) return
    runSearch(query, filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.platform, filters.timeRange, filters.sentiment, filters.sortBy])

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    setHasSearched(true)
    runSearch(query)
  }

  const particleSentiment = useMemo((): ParticleSentiment => {
    const s = data?.sentiment_summary
    if (!s || !hasSearched) return "neutral"
    if (s.positive > 50) return "positive"
    if (s.negative > 40) return "negative"
    return "neutral"
  }, [data?.sentiment_summary, hasSearched])

  const particleIntensity = loading ? 0.5 : hasSearched ? 0.35 : 0.2
  const showResults = hasSearched && (loading || data || error)

  return (
    <div className={cn(pageShellParticles, "min-h-screen w-full")}>
      <ParticleBackground
        key={particleSentiment}
        sentiment={particleSentiment}
        intensity={particleIntensity}
      />
      <div className="relative z-10 w-full">
        <DashboardLayout
          title="Search"
          subtitle="Track public opinion across social media"
        >
          <div className="flex w-full flex-col gap-6 lg:gap-8">
            {/* Search bar — compact when results shown */}
            <section
              className={cn(
                proCard,
                "p-5 sm:p-6",
                showResults ? "" : "py-10 sm:py-14"
              )}
            >
              {!showResults && (
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/20">
                    <Sparkles className="size-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                    Track Public Opinion
                  </h2>
                  <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
                    Search any topic, brand, person, or keyword to see what the
                    world thinks across 10+ live sources
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="w-full">
                <div className="relative flex items-center">
                  <Search
                    className="absolute left-4 size-5 text-gray-400"
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for a topic, brand, or keyword..."
                    className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-12 pr-28 text-sm text-gray-900 shadow-sm transition-all placeholder:text-gray-400 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/25 dark:border-[#2d2d44] dark:bg-[#252538] dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-[#2a2a40] sm:h-[52px] sm:pr-32"
                  />
                  <Button
                    type="submit"
                    disabled={loading || query.trim().length < 2}
                    className={cn(
                      "absolute right-2 h-9 gap-2 rounded-lg px-5 sm:h-10",
                      btnPrimary
                    )}
                  >
                    {loading && <Loader2 className="size-4 animate-spin" />}
                    Search
                  </Button>
                </div>
              </form>

              {!showResults && (
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {QUICK_SEARCHES.map((s) => (
                    <button
                      key={s.query}
                      type="button"
                      onClick={() => {
                        setQuery(s.query)
                        runSearch(s.query)
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-600 transition-all hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-[#2d2d44] dark:bg-[#1e1e30] dark:text-gray-300 dark:hover:border-purple-500/50 dark:hover:bg-purple-500/10 dark:hover:text-purple-300"
                    >
                      <span aria-hidden>{s.emoji}</span>
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </section>

            {data && data.total_results === 0 && !loading && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                <Info className="mt-0.5 size-4 shrink-0" />
                No results from live APIs for this query. Reddit, Dev.to, and
                Hacker News need no keys. Check the backend terminal for
                per-source logs.
              </div>
            )}

            {hasSearched && <SearchFiltersBar filters={filters} onChange={setFilters} />}

            {error && (
              <div
                className={cn(
                  proCard,
                  "border-red-200 bg-red-50 p-8 text-center dark:border-red-500/30 dark:bg-red-500/10"
                )}
              >
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Couldn&apos;t load results
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  There was a problem connecting to the data source. Please try
                  again.
                </p>
                <Button className="mt-4" onClick={() => runSearch(query)}>
                  Retry
                </Button>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center gap-3 py-16">
                <Loader2 className="size-6 animate-spin text-purple-600" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Searching live sources for &ldquo;{query}&rdquo;…
                </span>
              </div>
            )}

            {!loading && !error && data && (
              <div className="grid w-full grid-cols-1 gap-6 xl:grid-cols-12 xl:gap-8">
                <div className="flex flex-col gap-6 xl:col-span-8 xl:gap-8">
                  <SourcesStatusBar data={data} />
                  {data.wiki_summary && (
                    <WikipediaSummaryCard wiki={data.wiki_summary} />
                  )}
                  <OpinionSummaryCard
                    data={data}
                    timeLabel={TIME_LABELS[filters.timeRange] ?? "Last 24 hours"}
                  />
                  <AiInsightsSection data={data} timeRange={filters.timeRange} />
                  <SearchSentimentChart data={data} />
                  <ResultsFeed results={data.results} />
                </div>
                <div className="xl:col-span-4">
                  <div className="sticky top-[76px] flex flex-col gap-6">
                    <KeywordsSidebar data={data} />
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && !data && !hasSearched && (
              <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                Enter a topic above to see opinion data.
              </p>
            )}

            {!loading && !error && data && data.results.length === 0 && (
              <div className={cn(proCard, "p-12 text-center")}>
                <Search className="mx-auto size-12 text-gray-300 dark:text-gray-600" />
                <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">
                  No results found
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Try a different keyword or adjust your filters
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </DashboardLayout>
      </div>
    </div>
  )
}
