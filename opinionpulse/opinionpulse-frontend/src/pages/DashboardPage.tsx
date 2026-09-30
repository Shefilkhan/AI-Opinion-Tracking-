import { useDashboard, useLiveDebates } from "@/hooks/useDashboard"
import { DashboardIntelligenceLayout } from "@/components/dashboard/intelligence/DashboardIntelligenceLayout"
import { AiInsightOfTheDay } from "@/components/dashboard/AiInsightOfTheDay"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { InlineNotice } from "@/components/layout/InlineNotice"
import { Button } from "@/components/ui/button"
import { dashCardStatic } from "@/lib/dash-classes"
import { cn } from "@/lib/utils"

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className={cn(dashCardStatic, "h-[120px] animate-pulse bg-[var(--dash-surface-alt)]")} />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cn(dashCardStatic, "h-[88px] animate-pulse bg-[var(--dash-surface-alt)]")} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <div className={cn(dashCardStatic, "h-[280px] animate-pulse bg-[var(--dash-surface-alt)]")} />
        </div>
        <div className="xl:col-span-5">
          <div className={cn(dashCardStatic, "h-[280px] animate-pulse bg-[var(--dash-surface-alt)]")} />
        </div>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDashboard()
  const { data: liveDebatesData } = useLiveDebates(!isLoading || Boolean(data))

  const liveDebates = liveDebatesData ?? data?.live_debates ?? []
  const intelligence = data?.intelligence
  const sourcesSummary = data?.sources_summary

  const errorMessage = error instanceof Error ? error.message : "Could not load dashboard data"

  return (
    <DashboardLayout
      title="Overview"
      toolbarLastUpdated={data?.last_updated}
      toolbarIsLive={data ? Object.values(data.is_live ?? {}).some(Boolean) : true}
    >
      {isError && !data && (
        <div className={cn(dashCardStatic, "p-6")}>
          <InlineNotice variant="warning" title="Dashboard could not load">
            {errorMessage}
          </InlineNotice>
          <Button className="mt-4" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      )}

      {isLoading && !data ? (
        <OverviewSkeleton />
      ) : data && intelligence ? (
        <div className="flex flex-col gap-8">
          {data.demo_mode && (
            <InlineNotice variant="info">
              Some feeds are empty — add API keys in backend{" "}
              <code className="text-xs">.env.local</code> for full live coverage.
            </InlineNotice>
          )}

          <DashboardIntelligenceLayout
            intelligence={intelligence}
            liveDebates={liveDebates}
            platformPulse={data.platform_pulse}
            lastUpdated={data.last_updated}
          />

          <AiInsightOfTheDay />
        </div>
      ) : data ? (
        <InlineNotice variant="warning">
          Dashboard intelligence unavailable. Ensure the backend is updated and refresh.
        </InlineNotice>
      ) : null}

      {data && sourcesSummary && (
        <p className="sr-only">
          {sourcesSummary.live} of {sourcesSummary.total} data sources live
        </p>
      )}
    </DashboardLayout>
  )
}
