import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Loader2,
  MessageSquareWarning,
  Radar,
  RefreshCw,
  TrendingUp,
  Zap,
} from "lucide-react"
import { scanCrisisWatch } from "@/api/crisis"
import {
  CrisisLegendGrid,
  CrisisQuadrantBadge,
  CrisisRadarMatrix,
} from "@/components/crisis/CrisisRadarMatrix"
import { NarrativeCards } from "@/components/crisis/NarrativeCards"
import { MarketPriceChart } from "@/components/crisis/MarketPriceChart"
import { QuiverIntelligencePanel } from "@/components/crisis/QuiverIntelligencePanel"
import { SpreadTimeline } from "@/components/crisis/SpreadTimeline"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { InlineNotice } from "@/components/layout/InlineNotice"
import { Button } from "@/components/ui/button"
import { useCrisisDetail, useCrisisRadar } from "@/hooks/useCrisisRadar"
import { useQuiverIntelligence } from "@/hooks/useQuiverIntelligence"
import { useWatchMarketCharts } from "@/hooks/useWatchMarketCharts"
import { btnPrimary, proCard } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"
import "@/styles/crisis-radar.css"
import type { WatchMarketChart } from "@/api/market"

type DetailTab = "narratives" | "timeline"

function formatWatchPrice(chart: WatchMarketChart | undefined) {
  if (!chart?.current_price) return null
  const price =
    chart.current_price >= 1000
      ? `$${chart.current_price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
      : `$${chart.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const change =
    chart.change_pct != null
      ? `${chart.change_pct >= 0 ? "+" : ""}${chart.change_pct}%`
      : null
  return { price, change, symbol: chart.symbol, isUp: (chart.change_pct ?? 0) >= 0 }
}

function WatchLivePrice({ chart }: { chart: WatchMarketChart | undefined }) {
  const formatted = formatWatchPrice(chart)
  if (!formatted) {
    return (
      <span className="text-[10px] text-[var(--dash-text-faint)]">No market data</span>
    )
  }
  return (
    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px]">
      {formatted.symbol && (
        <span className="font-semibold text-[var(--dash-text-mid)]">{formatted.symbol}</span>
      )}
      <span className="font-semibold text-[var(--dash-text)]">{formatted.price}</span>
      {formatted.change && (
        <span
          className={cn(
            "font-semibold",
            formatted.isUp ? "text-emerald-600" : "text-red-600"
          )}
        >
          {formatted.change}
        </span>
      )}
    </span>
  )
}

export function CrisisRadarPage() {
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { data: radar, isLoading, error, refetch, isFetching } = useCrisisRadar()

  const points = radar?.points ?? []
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanMessage, setScanMessage] = useState<string | null>(null)
  const [detailTab, setDetailTab] = useState<DetailTab>("narratives")

  useEffect(() => {
    const fromUrl = searchParams.get("watch")
    if (fromUrl && points.length) {
      const match = points.find((p) => p.keyword.toLowerCase() === fromUrl.toLowerCase())
      if (match) setSelectedId(match.watch_id)
    }
  }, [searchParams, points])

  useEffect(() => {
    if (!selectedId && points.length) {
      const crisisFirst = points.find((p) => p.in_crisis) ?? points[0]
      setSelectedId(crisisFirst.watch_id)
    }
  }, [points, selectedId])

  const selectedPoint = useMemo(
    () => points.find((p) => p.watch_id === selectedId) ?? null,
    [points, selectedId]
  )

  const { data: detail, isLoading: detailLoading } = useCrisisDetail(selectedId)
  const { data: watchCharts, isLoading: marketLoading } = useWatchMarketCharts(points.length > 0)
  const marketChartByWatch = useMemo(() => {
    const map = new Map<string, WatchMarketChart>()
    for (const chart of watchCharts?.charts ?? []) {
      map.set(chart.watch_id, chart)
    }
    return map
  }, [watchCharts])
  const selectedMarketChart = selectedId ? marketChartByWatch.get(selectedId) : undefined
  const { data: quiverIntel, isLoading: quiverLoading } = useQuiverIntelligence(
    selectedPoint?.keyword ?? null
  )
  const hasNarratives = (detail?.narratives?.length ?? 0) > 0
  const hasTimeline = (detail?.timeline?.length ?? 0) > 0

  async function handleScan(watchId: string) {
    setScanning(true)
    setScanMessage(null)
    try {
      const res = await scanCrisisWatch(watchId)
      setScanMessage(res.message)
      await queryClient.invalidateQueries({ queryKey: ["crisis-radar"] })
      await queryClient.invalidateQueries({ queryKey: ["crisis-detail", watchId] })
      if (res.detail?.narratives?.length) setDetailTab("narratives")
      else if (res.detail?.timeline?.length) setDetailTab("timeline")
    } catch {
      setScanMessage("Scan failed. Check that the backend is running and try again.")
    } finally {
      setScanning(false)
    }
  }

  return (
    <DashboardLayout
      title="Crisis Radar"
      subtitle="Detect PR and security fires before they hit mainstream news"
    >
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Compact intro strip */}
        <div
          className={cn(
            proCard,
            "flex flex-wrap items-center gap-4 border-l-4 border-l-red-500 p-4 sm:p-5"
          )}
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600">
            <Zap className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-[var(--dash-text-mid)]">
              <strong className="text-[var(--dash-text)]">Volume</strong> = how many mentions in 30
              min · <strong className="text-[var(--dash-text)]">Velocity</strong> = how fast
              negativity is accelerating vs your baseline.
            </p>
            {radar && (
              <p className="mt-1 text-xs text-[var(--dash-text-faint)]">
                Auto-scan every {radar.scan_interval_minutes} min · Updated{" "}
                {new Date(radar.last_updated).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {error && (
          <InlineNotice variant="warning">
            Could not load Crisis Radar. Make sure you are signed in and the backend is running.
          </InlineNotice>
        )}

        {scanMessage && <InlineNotice variant="success">{scanMessage}</InlineNotice>}

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="size-8 animate-spin text-[var(--dash-accent)]" />
          </div>
        ) : points.length === 0 ? (
          <div className={cn(proCard, "p-12 text-center")}>
            <Radar className="mx-auto mb-4 size-12 text-[var(--dash-text-faint)]" />
            <h2 className="text-lg font-semibold">No brand watches yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--dash-text-mid)]">
              Create keyword alerts — each enabled alert appears here for early-warning tracking.
            </p>
            <Link to="/alerts" className={cn(btnPrimary, "mt-6 inline-flex px-6 py-2.5 text-sm")}>
              Set up alerts →
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-12">
            {/* Left: matrix + watches */}
            <div className="space-y-4 xl:col-span-5">
              <div className={cn(proCard, "p-5 sm:p-6")}>
                <h2 className="text-base font-semibold text-[var(--dash-text)]">Crisis Radar Matrix</h2>
                <p className="mt-0.5 text-xs text-[var(--dash-text-faint)]">
                  Click a dot to inspect · Top-right = crisis zone
                </p>
                <div className="mt-5">
                  <CrisisRadarMatrix
                    points={points}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                  />
                </div>
                <div className="mt-6">
                  <CrisisLegendGrid />
                </div>
              </div>

              <div className={cn(proCard, "p-4")}>
                <h3 className="mb-3 text-sm font-semibold text-[var(--dash-text)]">
                  Brand watches ({points.length})
                </h3>
                <ul className="space-y-2">
                  {points.map((p) => (
                    <li key={p.watch_id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(p.watch_id)}
                        className={cn(
                          "crisis-watch-row",
                          selectedId === p.watch_id && "crisis-watch-row-active"
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white",
                            p.quadrant === "crisis" && "bg-red-500",
                            p.quadrant === "watch" && "bg-orange-500",
                            p.quadrant === "noise" && "bg-amber-400",
                            p.quadrant === "quiet" && "bg-emerald-500"
                          )}
                        >
                          {p.keyword.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-[var(--dash-text)]">
                            {p.name || p.keyword}
                          </span>
                          <span className="text-xs text-[var(--dash-text-faint)]">
                            {p.spike_label ?? `${p.mention_count_30m} mentions · ${p.negative_pct_30m}% neg`}
                          </span>
                          <WatchLivePrice chart={marketChartByWatch.get(p.watch_id)} />
                        </div>
                        <CrisisQuadrantBadge quadrant={p.quadrant} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right: detail */}
            <div className="space-y-4 xl:col-span-7">
              {selectedPoint && (
                <>
                  <div className={cn(proCard, "overflow-hidden")}>
                    <div className="border-b border-[var(--dash-border)] p-5 sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-xl font-semibold tracking-tight">
                              {selectedPoint.keyword}
                            </h2>
                            {selectedPoint.in_crisis && (
                              <AlertTriangle className="size-5 animate-pulse text-red-500" />
                            )}
                          </div>
                          <p className="mt-1 text-sm text-[var(--dash-text-mid)]">
                            {selectedPoint.status_explanation}
                          </p>
                          {selectedPoint.spike_label && (
                            <p
                              className={cn(
                                "mt-2 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold",
                                selectedPoint.spike_severity === "critical" &&
                                  "bg-red-500/10 text-red-600",
                                selectedPoint.spike_severity === "elevated" &&
                                  "bg-orange-500/10 text-orange-600",
                                selectedPoint.spike_severity === "watch" &&
                                  "bg-amber-500/10 text-amber-700",
                                (!selectedPoint.spike_severity ||
                                  selectedPoint.spike_severity === "normal") &&
                                  "bg-muted text-muted-foreground"
                              )}
                            >
                              <Zap className="size-3.5" />
                              {selectedPoint.spike_label}
                              {selectedPoint.baseline_negative_30m > 0 && (
                                <span className="font-normal opacity-80">
                                  · baseline {selectedPoint.baseline_negative_30m} neg / 30m
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                        <CrisisQuadrantBadge quadrant={selectedPoint.quadrant} />
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                        {[
                          {
                            label: "Volume",
                            value: selectedPoint.volume_score,
                            hint: "0–100 score",
                            icon: BarChart3,
                          },
                          {
                            label: "Velocity",
                            value: selectedPoint.velocity_score,
                            hint: "acceleration",
                            icon: TrendingUp,
                          },
                          {
                            label: "Mentions",
                            value: selectedPoint.mention_count_30m,
                            hint: "last 30 min",
                            icon: Activity,
                          },
                          {
                            label: "Negative",
                            value: `${selectedPoint.negative_pct_30m}%`,
                            hint: "share (30m)",
                            icon: MessageSquareWarning,
                          },
                        ].map((stat) => (
                          <div key={stat.label} className="crisis-metric-card">
                            <div className="mb-2 flex items-center gap-1.5 text-[var(--dash-text-faint)]">
                              <stat.icon className="size-3.5" />
                              <span className="crisis-metric-label">{stat.label}</span>
                            </div>
                            <p className="crisis-metric-value">{stat.value}</p>
                            <p className="mt-0.5 text-[10px] text-[var(--dash-text-faint)]">
                              {stat.hint}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <Button
                          className={btnPrimary}
                          disabled={scanning}
                          onClick={() => handleScan(selectedPoint.watch_id)}
                        >
                          {scanning ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-2 size-4" />
                          )}
                          Scan now
                        </Button>
                        <Button variant="outline" size="default" disabled={isFetching} onClick={() => refetch()}>
                          Refresh
                        </Button>
                        <Link
                          to={`/search?q=${encodeURIComponent(selectedPoint.keyword)}`}
                          className="inline-flex h-10 items-center rounded-full border border-[var(--dash-border)] px-4 text-sm font-medium transition-colors hover:bg-[var(--dash-surface-elevated)]"
                        >
                          Open in Search
                        </Link>
                      </div>
                    </div>

                    {/* Market price chart */}
                    <div className="border-b border-[var(--dash-border)] px-5 py-5 sm:px-6">
                      <h3 className="mb-3 text-sm font-semibold text-[var(--dash-text)]">
                        Market price
                      </h3>
                      <p className="mb-3 text-xs text-[var(--dash-text-faint)]">
                        Live crypto or public-company stock chart matched to this watch keyword.
                      </p>
                      <MarketPriceChart data={selectedMarketChart} loading={marketLoading} />
                    </div>

                    {/* Quiver alternative data */}
                    <div className="border-b border-[var(--dash-border)] px-5 py-5 sm:px-6">
                      <QuiverIntelligencePanel data={quiverIntel} loading={quiverLoading} />
                    </div>

                    {/* Tabbed narratives / timeline */}
                    <div className="p-5 sm:p-6">
                      <div className="mb-4 flex gap-1 rounded-lg border border-[var(--dash-border)] bg-[var(--dash-bg)] p-1">
                        <button
                          type="button"
                          onClick={() => setDetailTab("narratives")}
                          className={cn(
                            "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            detailTab === "narratives"
                              ? "bg-[var(--dash-surface)] text-[var(--dash-text)] shadow-sm"
                              : "text-[var(--dash-text-faint)] hover:text-[var(--dash-text-mid)]"
                          )}
                        >
                          Narrative clusters
                          {hasNarratives && (
                            <span className="ml-1.5 text-[10px] opacity-70">
                              ({detail?.narratives.length})
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDetailTab("timeline")}
                          className={cn(
                            "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            detailTab === "timeline"
                              ? "bg-[var(--dash-surface)] text-[var(--dash-text)] shadow-sm"
                              : "text-[var(--dash-text-faint)] hover:text-[var(--dash-text-mid)]"
                          )}
                        >
                          Spread timeline
                          {hasTimeline && (
                            <span className="ml-1.5 text-[10px] opacity-70">
                              ({detail?.timeline.length})
                            </span>
                          )}
                        </button>
                      </div>

                      {detailLoading ? (
                        <div className="flex justify-center py-12">
                          <Loader2 className="size-6 animate-spin text-[var(--dash-accent)]" />
                        </div>
                      ) : detailTab === "narratives" ? (
                        <NarrativeCards narratives={detail?.narratives ?? []} />
                      ) : (
                        <SpreadTimeline timeline={detail?.timeline ?? []} />
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
