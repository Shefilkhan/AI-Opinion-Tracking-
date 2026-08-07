import { useState } from "react"

import { useDashboard } from "@/hooks/useDashboard"

import { AiInsightOfTheDay } from "@/components/dashboard/AiInsightOfTheDay"

import { BetaAccessBanner } from "@/components/dashboard/BetaAccessBanner"

import { DebateList } from "@/components/dashboard/DebateList"

import { LiveDebates } from "@/components/dashboard/LiveDebates"

import { OverviewPulseCards } from "@/components/dashboard/OverviewPulseCards"

import { PlatformPulsePanel } from "@/components/dashboard/PlatformPulsePanel"

import { RecentActivityPanel } from "@/components/dashboard/RecentActivityPanel"

import { RecentSearchChips } from "@/components/dashboard/RecentSearchChips"

import { SentimentDonutChart } from "@/components/dashboard/SentimentDonutChart"

import { TopicsTable } from "@/components/dashboard/TopicsTable"

import { WeeklyActivityChart } from "@/components/dashboard/WeeklyActivityChart"

import { DashboardSection } from "@/components/dashboard/DashboardSection"

import { DashboardLayout } from "@/components/layout/DashboardLayout"

import { dashCardStatic } from "@/lib/dash-classes"

import {
  getRecentSearches,
  removeRecentSearch,
} from "@/lib/recentSearchStorage"

import { getSelectedPlan } from "@/lib/planStorage"

import { cn } from "@/lib/utils"

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <div className={cn(dashCardStatic, "h-[220px] animate-pulse bg-[var(--dash-surface-alt)]")} />
        </div>
        <div className="xl:col-span-5">
          <div className={cn(dashCardStatic, "h-[220px] animate-pulse bg-[var(--dash-surface-alt)]")} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <div className={cn(dashCardStatic, "h-[320px] animate-pulse bg-[var(--dash-surface-alt)]")} />
        </div>
        <div className="xl:col-span-5">
          <div className={cn(dashCardStatic, "h-[320px] animate-pulse bg-[var(--dash-surface-alt)]")} />
        </div>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const [recent, setRecent] = useState(getRecentSearches)
  const selectedPlan = getSelectedPlan()
  const { data, isLoading, isFetching, refetch } = useDashboard()

  const liveSourceCount = data
    ? Object.values(data.is_live ?? {}).filter(Boolean).length
    : 0

  return (
    <DashboardLayout
      title="Overview"
      toolbarLastUpdated={data?.last_updated}
      toolbarIsLive={data ? Object.values(data.is_live ?? {}).some(Boolean) : true}
    >
      {isLoading && !data ? (
        <OverviewSkeleton />
      ) : data ? (
        <div className="flex flex-col gap-8">
          {selectedPlan && <BetaAccessBanner plan={selectedPlan} />}

          {data.demo_mode && (
            <div
              className={cn(
                dashCardStatic,
                "px-4 py-3 text-sm text-[var(--dash-text-mid)]"
              )}
            >
              Some feeds are empty — add API keys in backend{" "}
              <code className="text-xs text-[var(--dash-text)]">.env.local</code> for full live
              coverage.
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <OverviewPulseCards stats={data.stats} sourcesLive={liveSourceCount} />
            </div>
            <div className="xl:col-span-5">
              <RecentActivityPanel items={data.live_debates ?? []} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <WeeklyActivityChart platformPulse={data.platform_pulse} />
            </div>
            <div className="xl:col-span-5">
              <SentimentDonutChart stats={data.stats} />
            </div>
          </div>

          <LiveDebates
            debates={data.live_debates ?? []}
            isRefreshing={isFetching}
            lastUpdated={data.last_updated}
            onRefresh={() => void refetch()}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <DebateList debates={data.debates} />
            </div>
            <div className="lg:col-span-5">
              <PlatformPulsePanel items={data.platform_pulse} />
            </div>
          </div>

          <div className="topics-table-wrapper !mt-0">
            <TopicsTable />
          </div>

          <AiInsightOfTheDay />

          <DashboardSection title="Your recent searches">
            <RecentSearchChips
              items={recent}
              onRemove={(q) => setRecent(removeRecentSearch(q))}
            />
          </DashboardSection>
        </div>
      ) : null}
    </DashboardLayout>
  )
}
