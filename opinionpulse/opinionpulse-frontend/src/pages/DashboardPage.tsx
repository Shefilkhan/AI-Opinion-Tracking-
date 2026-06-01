import { useQuery } from "@tanstack/react-query"
import { getCurrentUser } from "@/api/auth"
import { getDashboardSummary, getDashboardTrending } from "@/api/dashboard"
import { getSettingsStatus } from "@/api/settings"
import { DashboardHero } from "@/components/dashboard/DashboardHero"
import { DashboardStats } from "@/components/dashboard/DashboardStats"
import { GettingStartedChecklist } from "@/components/dashboard/GettingStartedChecklist"
import { LatestSentimentSnapshot } from "@/components/dashboard/LatestSentimentSnapshot"
import { RecentProjectsPanel } from "@/components/dashboard/RecentProjectsPanel"
import { SourceStatusPanel } from "@/components/dashboard/SourceStatusPanel"
import { TrendingNewsPanel } from "@/components/dashboard/TrendingNewsPanel"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { LoadingState } from "@/components/ui/LoadingState"

export function DashboardPage() {
  const userQuery = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
  })

  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummary,
  })

  const trendingQuery = useQuery({
    queryKey: ["dashboard-trending"],
    queryFn: getDashboardTrending,
  })

  const statusQuery = useQuery({
    queryKey: ["settings-status"],
    queryFn: getSettingsStatus,
  })

  const summary = summaryQuery.data

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Your opinion intelligence hub"
    >
      {summaryQuery.isLoading ? (
        <LoadingState label="Loading dashboard…" />
      ) : (
        <div className="flex flex-col gap-6 sm:gap-8">
          <DashboardHero userName={userQuery.data?.name} />

          <DashboardStats summary={summary} />

          <TrendingNewsPanel
            items={trendingQuery.data?.items ?? []}
            message={trendingQuery.data?.message}
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
            <RecentProjectsPanel projects={summary?.recent_projects ?? []} />
            <LatestSentimentSnapshot snapshot={summary?.latest_sentiment} />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
            <SourceStatusPanel status={statusQuery.data} />
            <GettingStartedChecklist summary={summary} />
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
