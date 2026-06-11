import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Loader2, Search, Sparkles, Download, FileText } from "lucide-react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { EmptyState } from "@/components/layout/EmptyState"
import { InlineNotice } from "@/components/layout/InlineNotice"
import {
  pageShell,
  proCard,
  btnPrimary,
  sectionTitle,
  inputSurface,
} from "@/lib/ui-classes"
import { Button } from "@/components/ui/button"
import { KeywordsSidebar } from "@/components/search/KeywordsSidebar"
import { AiInsightsSection } from "@/components/search/AiInsightsSection"
import { OpinionSummaryCard } from "@/components/search/OpinionSummaryCard"
import { ResultsFeed } from "@/components/search/ResultsFeed"
import { SearchFiltersBar } from "@/components/search/SearchFiltersBar"
import { SourcesStatusBar } from "@/components/search/SourcesStatusBar"
import { WikipediaSummaryCard } from "@/components/search/WikipediaSummaryCard"
import { SearchSentimentChart } from "@/components/search/SearchSentimentChart"
import { PlatformSentimentChart } from "@/components/search/PlatformSentimentChart"
import { PlatformShareChart } from "@/components/search/PlatformShareChart"
import { WordCloudChart } from "@/components/search/WordCloudChart"
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
  { label: "AI & Technology", query: "Artificial Intelligence" },
  { label: "Climate Change", query: "Climate Change" },
  { label: "Crypto & Bitcoin", query: "Bitcoin" },
  { label: "Politics", query: "Elections" },
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

  function handleExportCSV() {
    if (!data?.results?.length) return
    
    // Create CSV content
    const headers = ["ID", "Platform", "Author", "Sentiment", "Sentiment Score", "Date", "Content", "URL"]
    const rows = data.results.map(r => [
      r.id,
      r.platform,
      r.author,
      r.sentiment,
      r.sentiment_score?.toFixed(2) || "",
      r.posted_at,
      `"${(r.content || "").replace(/"/g, '""').replace(/\n/g, ' ')}"`, // escape quotes and newlines
      r.source_url
    ])
    
    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n")
    
    // Download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `opinionpulse_export_${query}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function handleExportPDF() {
    // A simple window.print() will trigger the browser's PDF generator.
    // CSS media queries in index.css can handle printing layout.
    window.print()
  }

  const showResults = hasSearched && (loading || data || error)

  return (
    <div className={cn(pageShell, "min-h-screen w-full")}>
      <div className="relative z-10 w-full">
        <DashboardLayout
          title="Search"
          subtitle="Track public opinion across social media"
        >
          <div className="flex w-full flex-col gap-6 lg:gap-8">
            <section
              className={cn(
                proCard,
                "p-5 sm:p-6",
                showResults ? "py-5" : "py-10 sm:py-14"
              )}
            >
              {!showResults && (
                <div className="mb-8 text-center">
                  <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                    <Sparkles className="size-7 text-primary" />
                  </div>
                  <h2 className={cn(sectionTitle, "text-2xl sm:text-3xl")}>
                    Track Public Opinion
                  </h2>
                  <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
                    Search any topic, brand, person, or keyword to see what the
                    world thinks across 10+ live sources
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl">
                <div className="relative flex items-center">
                  <Search
                    className="absolute left-5 size-5 text-muted-foreground"
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for a topic, brand, or keyword..."
                    className={cn(
                      inputSurface,
                      "h-14 w-full rounded-2xl bg-muted/40 py-2 pl-14 pr-32 text-base shadow-none sm:h-[56px] sm:pr-36"
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={loading || query.trim().length < 2}
                    className={cn(
                      "absolute right-2 h-10 gap-2 rounded-xl px-6 sm:h-11",
                      btnPrimary
                    )}
                  >
                    {loading && <Loader2 className="size-4 animate-spin" />}
                    Search
                  </Button>
                </div>
              </form>

              {!showResults && (
                <div className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2">
                  {QUICK_SEARCHES.map((s) => (
                    <button
                      key={s.query}
                      type="button"
                      onClick={() => {
                        setQuery(s.query)
                        runSearch(s.query)
                      }}
                      className="inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:border-primary/30 hover:bg-accent hover:text-accent-foreground"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </section>

            {data && data.total_results === 0 && !loading && (
              <InlineNotice variant="warning">
                No results from live APIs for this query. Reddit, Dev.to, and
                Hacker News need no keys. Check the backend terminal for
                per-source logs.
              </InlineNotice>
            )}

            {hasSearched && (
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex-1 min-w-0">
                  <SearchFiltersBar filters={filters} onChange={setFilters} />
                </div>
                {data && data.results.length > 0 && (
                  <div className="flex shrink-0 items-center gap-3">
                    <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2 h-10 px-4 rounded-xl shadow-sm bg-card hover:bg-card/80">
                      <Download className="size-4" />
                      Export CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2 h-10 px-4 rounded-xl shadow-sm bg-card hover:bg-card/80">
                      <FileText className="size-4" />
                      Print Report
                    </Button>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className={cn(proCard, "p-8 text-center")}>
                <InlineNotice variant="warning" title="Couldn't load results" className="mb-4 text-left">
                  There was a problem connecting to the data source. Please try
                  again.
                </InlineNotice>
                <Button className={cn("mt-4", btnPrimary)} onClick={() => runSearch(query)}>
                  Retry
                </Button>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center gap-3 py-16">
                <Loader2 className="size-6 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
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
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 xl:gap-8">
                    <PlatformSentimentChart data={data} />
                    <PlatformShareChart data={data} />
                    <WordCloudChart data={data} />
                  </div>
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
              <EmptyState
                icon={Search}
                title="Enter a topic to get started"
                description="Search any topic, brand, or keyword to see opinion data across live sources."
                compact
              />
            )}

            {!loading && !error && data && data.results.length === 0 && (
              <EmptyState
                icon={Search}
                title="No results found"
                description="Try a different keyword or adjust your filters"
                action={
                  <Button
                    variant="outline"
                    onClick={() => setFilters(DEFAULT_FILTERS)}
                  >
                    Clear filters
                  </Button>
                }
              />
            )}
          </div>
        </DashboardLayout>
      </div>
    </div>
  )
}
