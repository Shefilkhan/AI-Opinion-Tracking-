import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Info, Loader2, Search } from "lucide-react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { KeywordsSidebar } from "@/components/search/KeywordsSidebar"
import { OpinionSummaryCard } from "@/components/search/OpinionSummaryCard"
import { ResultsFeed } from "@/components/search/ResultsFeed"
import { SearchFiltersBar } from "@/components/search/SearchFiltersBar"
import { SourcesStatusBar } from "@/components/search/SourcesStatusBar"
import { WikipediaSummaryCard } from "@/components/search/WikipediaSummaryCard"
import { SearchSentimentChart } from "@/components/search/SearchSentimentChart"
import { btnPrimary } from "@/lib/ui-classes"
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
  { label: "🔥 AI & Technology", query: "Artificial Intelligence" },
  { label: "🌍 Climate Change", query: "Climate Change" },
  { label: "💰 Crypto & Bitcoin", query: "Bitcoin" },
  { label: "🗳️ Politics", query: "Elections" },
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

  const [hasSearched, setHasSearched] = useState(false)

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

  return (
    <DashboardLayout title="Search" subtitle="Track public opinion across social media">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="text-center">
          <h2 className="text-2xl font-semibold text-foreground">Track Public Opinion</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Search any topic, brand, person, or keyword to see what the world thinks
          </p>
          <form onSubmit={handleSubmit} className="mx-auto mt-6 max-w-[680px]">
            <div className="relative flex items-center">
              <Search
                className="absolute left-4 size-5 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for a topic, brand, or keyword..."
                className="h-[54px] w-full rounded-xl border border-gray-200 bg-white py-2 pl-12 pr-28 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <Button
                type="submit"
                disabled={loading || query.trim().length < 2}
                className={cn(
                  "absolute right-2 h-10 gap-2 rounded-lg px-5",
                  btnPrimary
                )}
              >
                {loading && <Loader2 className="size-4 animate-spin" />}
                Search
              </Button>
            </div>
          </form>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {QUICK_SEARCHES.map((s) => (
              <button
                key={s.query}
                type="button"
                onClick={() => {
                  setQuery(s.query)
                  runSearch(s.query)
                }}
                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-primary"
              >
                {s.label}
              </button>
            ))}
          </div>
        </section>

        {data && data.total_results === 0 && !loading && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <Info className="size-4 shrink-0 mt-0.5" />
            No results from live APIs for this query. Reddit, Dev.to, and Hacker News
            need no keys. Check the backend terminal for per-source logs.
          </div>
        )}

        <SearchFiltersBar filters={filters} onChange={setFilters} />

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
            <h3 className="font-semibold text-foreground">Couldn&apos;t load results</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              There was a problem connecting to the data source. Please try again.
            </p>
            <Button className="mt-4" onClick={() => runSearch(query)}>
              Retry
            </Button>
          </div>
        )}

        {!loading && !error && data && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <SourcesStatusBar data={data} />
              {data.wiki_summary && (
                <WikipediaSummaryCard wiki={data.wiki_summary} />
              )}
              <OpinionSummaryCard
                data={data}
                timeLabel={TIME_LABELS[filters.timeRange] ?? "Last 24 hours"}
              />
              <SearchSentimentChart data={data} />
              <ResultsFeed results={data.results} />
            </div>
            <div className="xl:col-span-1">
              <KeywordsSidebar data={data} />
            </div>
          </div>
        )}

        {!loading && !error && !data && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Enter a topic above to see opinion data.
          </p>
        )}

        {!loading && !error && data && data.results.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
            <Search className="mx-auto size-12 text-muted-foreground/40" />
            <h3 className="mt-4 font-semibold">No results found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
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
  )
}
