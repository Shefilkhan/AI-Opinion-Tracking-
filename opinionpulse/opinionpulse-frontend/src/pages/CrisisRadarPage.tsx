import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { Radar } from "lucide-react"
import { scanCrisisWatch } from "@/api/crisis"
import { AttentionSummary } from "@/components/crisis/AttentionSummary"
import { BrandWatchList } from "@/components/crisis/BrandWatchList"
import { CrisisHeader } from "@/components/crisis/CrisisHeader"
import { CrisisLegendGrid, CrisisRadarMatrix } from "@/components/crisis/CrisisRadarMatrix"
import { CrisisLoadingSkeleton } from "@/components/crisis/CrisisLoadingSkeleton"
import { MarketPriceChart } from "@/components/crisis/MarketPriceChart"
import { NarrativeCards, NegativeDriversPanel } from "@/components/crisis/NarrativeCards"
import { QuiverIntelligencePanel } from "@/components/crisis/QuiverIntelligencePanel"
import { RecommendedAction } from "@/components/crisis/RecommendedAction"
import { SelectedWatchPanel } from "@/components/crisis/SelectedWatchPanel"
import { SignalHistoryChart } from "@/components/crisis/SignalHistoryChart"
import { RecentSignalsPanel, SpreadTimeline } from "@/components/crisis/SpreadTimeline"
import { WhatChangedPanel } from "@/components/crisis/WhatChangedPanel"
import { WhyThisStatus } from "@/components/crisis/WhyThisStatus"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { InlineNotice } from "@/components/layout/InlineNotice"
import { useCrisisDetail, useCrisisRadar } from "@/hooks/useCrisisRadar"
import { useMarketChart } from "@/hooks/useMarketChart"
import { useQuiverIntelligence } from "@/hooks/useQuiverIntelligence"
import { quadrantDisplayLabel } from "@/lib/crisis-display"
import { btnPrimary, proCard } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"
import "@/styles/crisis-radar.css"

export function CrisisRadarPage() {
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { data: radar, isLoading, error, isFetching } = useCrisisRadar()

  const points = radar?.points ?? []
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanMessage, setScanMessage] = useState<string | null>(null)
  const autoScanAttempted = useRef<Set<string>>(new Set())

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
  const { data: marketChart, isLoading: marketLoading } = useMarketChart(
    selectedPoint?.keyword ?? null
  )
  const { data: quiverIntel, isLoading: quiverLoading } = useQuiverIntelligence(
    selectedPoint?.keyword ?? null
  )

  const handleScan = useCallback(
    async (watchId: string, options?: { silent?: boolean }) => {
      setScanning(true)
      if (!options?.silent) setScanMessage(null)
      try {
        const res = await scanCrisisWatch(watchId)
        if (!options?.silent) setScanMessage(res.message)
        await queryClient.invalidateQueries({ queryKey: ["crisis-radar"] })
        await queryClient.invalidateQueries({ queryKey: ["crisis-detail", watchId] })
      } catch {
        if (!options?.silent) {
          setScanMessage("Scan failed. Check that the backend is running and try again.")
        }
      } finally {
        setScanning(false)
      }
    },
    [queryClient]
  )

  useEffect(() => {
    if (!selectedId || scanning) return
    const point = points.find((p) => p.watch_id === selectedId)
    if (!point || point.last_scanned_at || autoScanAttempted.current.has(selectedId)) return
    autoScanAttempted.current.add(selectedId)
    void handleScan(selectedId, { silent: true })
  }, [selectedId, points, scanning, handleScan])

  return (
    <DashboardLayout title="Crisis Radar" subtitle="Real-time reputation and risk intelligence">
      <div className="crisis-page mx-auto max-w-7xl space-y-5">
        {error && (
          <InlineNotice variant="warning">
            Could not load Crisis Radar. Make sure you are signed in and the backend is running.
          </InlineNotice>
        )}

        {scanMessage && <InlineNotice variant="success">{scanMessage}</InlineNotice>}

        {isLoading ? (
          <CrisisLoadingSkeleton />
        ) : points.length === 0 ? (
          <div className={cn(proCard, "p-12 text-center")}>
            <Radar className="mx-auto mb-4 size-12 text-[var(--dash-text-faint)]" />
            <h2 className="text-xl font-semibold text-[var(--dash-text)]">No monitored topics yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--dash-text-mid)]">
              Add a brand watch to begin Crisis Radar monitoring.
            </p>
            <Link to="/alerts" className={cn(btnPrimary, "mt-6 inline-flex px-6 py-2.5 text-sm")}>
              Add Brand Watch
            </Link>
          </div>
        ) : (
          <>
            {radar && (
              <CrisisHeader
                points={points}
                lastUpdated={radar.last_updated}
                scanIntervalMinutes={radar.scan_interval_minutes}
                isLive={!isFetching}
              />
            )}

            <AttentionSummary points={points} onSelect={setSelectedId} />

            {/* Matrix + selected topic */}
            <div className="grid gap-5 xl:grid-cols-12">
              <div className={cn(proCard, "p-5 sm:p-6 xl:col-span-6")}>
                <h2 className="crisis-section-label m-0">Crisis matrix</h2>
                <p className="mt-1 text-xs text-[var(--dash-text-faint)]">
                  Click a point to inspect · Top-right = crisis zone
                </p>
                <div className="mt-5">
                  <CrisisRadarMatrix
                    points={points}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                  />
                </div>
                <div className="mt-5">
                  <CrisisLegendGrid />
                </div>
              </div>

              <div className="xl:col-span-6">
                {selectedPoint && (
                  <SelectedWatchPanel
                    point={selectedPoint}
                    scanning={scanning}
                    onScan={() => handleScan(selectedPoint.watch_id)}
                  />
                )}
              </div>
            </div>

            {/* Watches + why status */}
            {selectedPoint && (
              <div className="grid gap-5 lg:grid-cols-12">
                <div className="lg:col-span-5">
                  <BrandWatchList
                    points={points}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                  />
                </div>
                <div className="lg:col-span-7 space-y-5">
                  <WhyThisStatus point={selectedPoint} />
                  <WhatChangedPanel point={selectedPoint} />
                </div>
              </div>
            )}

            {selectedPoint && detail && !detailLoading && (
              <SignalHistoryChart
                events={detail.recent_events ?? []}
                currentVolume={selectedPoint.volume_score}
                currentVelocity={selectedPoint.velocity_score}
              />
            )}

            {selectedPoint && (
              <div className="grid gap-5 xl:grid-cols-2">
                <div className={cn(proCard, "p-5 sm:p-6")}>
                  <MarketPriceChart
                    data={marketChart}
                    loading={marketLoading}
                    watchPoint={selectedPoint}
                  />
                </div>
                <div className={cn(proCard, "p-5 sm:p-6")}>
                  <QuiverIntelligencePanel
                    data={quiverIntel}
                    loading={quiverLoading}
                    priceChangePct={marketChart?.change_pct ?? null}
                  />
                </div>
              </div>
            )}

            {selectedPoint && (
              <div className="grid gap-5 xl:grid-cols-12">
                <div className={cn(proCard, "p-5 sm:p-6 xl:col-span-7")}>
                  <h3 className="crisis-section-label m-0">Narrative clusters</h3>
                  {detailLoading ? (
                    <div className="mt-6 h-40 animate-pulse rounded-xl bg-[var(--dash-bg)]" />
                  ) : (
                    <div className="mt-4">
                      <NarrativeCards
                        narratives={detail?.narratives ?? []}
                        topicKeyword={selectedPoint.keyword}
                      />
                    </div>
                  )}
                </div>
                <div className={cn(proCard, "p-5 sm:p-6 xl:col-span-5")}>
                  <h3 className="crisis-section-label m-0">Spread timeline</h3>
                  {detailLoading ? (
                    <div className="mt-6 h-40 animate-pulse rounded-xl bg-[var(--dash-bg)]" />
                  ) : (
                    <div className="mt-4">
                      <SpreadTimeline
                        timeline={detail?.timeline ?? []}
                        currentStatus={quadrantDisplayLabel(selectedPoint.quadrant)}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedPoint && !detailLoading && (() => {
              const hasDrivers = (detail?.narratives ?? []).some((n) => n.negative_pct >= 40)
              const hasSignals = (detail?.timeline?.length ?? 0) > 0
              if (!hasDrivers && !hasSignals) return null
              return (
                <div className="grid gap-5 lg:grid-cols-2">
                  {hasDrivers && (
                    <div className={cn(proCard, "p-5 sm:p-6")}>
                      <NegativeDriversPanel
                        narratives={detail?.narratives ?? []}
                        topicKeyword={selectedPoint.keyword}
                      />
                    </div>
                  )}
                  {hasSignals && (
                    <div className={cn(proCard, "p-5 sm:p-6")}>
                      <RecentSignalsPanel timeline={detail?.timeline ?? []} />
                    </div>
                  )}
                </div>
              )
            })()}

            {selectedPoint && (
              <RecommendedAction keyword={selectedPoint.keyword} quadrant={selectedPoint.quadrant} />
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
