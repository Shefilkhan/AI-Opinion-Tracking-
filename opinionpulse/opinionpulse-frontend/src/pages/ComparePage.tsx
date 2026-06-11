import { useState } from "react"
import { Loader2, GitCompare, Sparkles } from "lucide-react"
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
import { OpinionSummaryCard } from "@/components/search/OpinionSummaryCard"
import { WordCloudChart } from "@/components/search/WordCloudChart"
import { PlatformShareChart } from "@/components/search/PlatformShareChart"
import { searchOpinions } from "@/lib/api/search"
import type { SearchResponse } from "@/lib/api/types"
import { cn } from "@/lib/utils"

export function ComparePage() {
  const [queryA, setQueryA] = useState("")
  const [queryB, setQueryB] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dataA, setDataA] = useState<SearchResponse | null>(null)
  const [dataB, setDataB] = useState<SearchResponse | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  async function runCompare() {
    const qA = queryA.trim()
    const qB = queryB.trim()
    if (qA.length < 2 || qB.length < 2) return

    setLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      const [resA, resB] = await Promise.all([
        searchOpinions(qA, { platform: "all", timeRange: "24h", sentiment: "all", sortBy: "recent" }),
        searchOpinions(qB, { platform: "all", timeRange: "24h", sentiment: "all", sortBy: "recent" })
      ])
      setDataA(resA)
      setDataB(resB)
    } catch {
      setError("Couldn't load results for comparison.")
      setDataA(null)
      setDataB(null)
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    runCompare()
  }

  const showResults = hasSearched && (loading || (dataA && dataB) || error)

  return (
    <div className={cn(pageShell, "min-h-screen w-full")}>
      <div className="relative z-10 w-full">
        <DashboardLayout
          title="Compare Topics"
          subtitle="Head-to-head analysis of public opinion"
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
                    <GitCompare className="size-7 text-primary" />
                  </div>
                  <h2 className={cn(sectionTitle, "text-2xl sm:text-3xl")}>
                    Head-to-Head Compare
                  </h2>
                  <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
                    Compare the sentiment, volume, and trending topics of two brands or keywords simultaneously.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mx-auto w-full max-w-4xl">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="relative w-full">
                    <input
                      type="text"
                      value={queryA}
                      onChange={(e) => setQueryA(e.target.value)}
                      placeholder="Topic A (e.g., React)"
                      className={cn(
                        inputSurface,
                        "h-14 w-full rounded-2xl bg-muted/40 px-6 text-base shadow-none sm:h-[56px] border-l-4 border-l-blue-500"
                      )}
                    />
                  </div>
                  <div className="flex shrink-0 items-center justify-center bg-muted rounded-full p-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">vs</span>
                  </div>
                  <div className="relative w-full">
                    <input
                      type="text"
                      value={queryB}
                      onChange={(e) => setQueryB(e.target.value)}
                      placeholder="Topic B (e.g., Angular)"
                      className={cn(
                        inputSurface,
                        "h-14 w-full rounded-2xl bg-muted/40 px-6 text-base shadow-none sm:h-[56px] border-l-4 border-l-orange-500"
                      )}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading || queryA.trim().length < 2 || queryB.trim().length < 2}
                    className={cn(
                      "h-14 px-8 rounded-2xl shrink-0 w-full md:w-auto",
                      btnPrimary
                    )}
                  >
                    {loading ? <Loader2 className="size-5 animate-spin" /> : "Compare"}
                  </Button>
                </div>
              </form>
            </section>

            {error && (
              <div className={cn(proCard, "p-8 text-center")}>
                <InlineNotice variant="warning" title="Couldn't load results" className="mb-4 text-left">
                  {error}
                </InlineNotice>
                <Button className={cn("mt-4", btnPrimary)} onClick={runCompare}>
                  Retry
                </Button>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center gap-3 py-16">
                <Loader2 className="size-6 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  Analyzing data for &ldquo;{queryA}&rdquo; vs &ldquo;{queryB}&rdquo;…
                </span>
              </div>
            )}

            {!loading && !error && dataA && dataB && (
              <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2 xl:gap-8">
                {/* Column A */}
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-center rounded-2xl bg-blue-500/10 py-3 border border-blue-500/20">
                    <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">{queryA}</h3>
                  </div>
                  <OpinionSummaryCard data={dataA} timeLabel="Last 24 hours" />
                  <PlatformShareChart data={dataA} />
                  <WordCloudChart data={dataA} />
                </div>
                
                {/* Column B */}
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-center rounded-2xl bg-orange-500/10 py-3 border border-orange-500/20">
                    <h3 className="text-xl font-bold text-orange-600 dark:text-orange-400">{queryB}</h3>
                  </div>
                  <OpinionSummaryCard data={dataB} timeLabel="Last 24 hours" />
                  <PlatformShareChart data={dataB} />
                  <WordCloudChart data={dataB} />
                </div>
              </div>
            )}

            {!loading && !error && !dataA && !hasSearched && (
              <EmptyState
                icon={GitCompare}
                title="Enter two topics to compare"
                description="See a side-by-side analysis of sentiment, volume, and trending topics."
                compact
              />
            )}
          </div>
        </DashboardLayout>
      </div>
    </div>
  )
}
