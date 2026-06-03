import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search, ThumbsDown, ThumbsUp, TrendingUp } from "lucide-react"
import { getDashboardOverview } from "@/api/dashboard"
import { DebateList } from "@/components/dashboard/DebateList"
import { MetricCard } from "@/components/dashboard/MetricCard"
import { PlatformPulsePanel } from "@/components/dashboard/PlatformPulsePanel"
import { RecentSearchChips } from "@/components/dashboard/RecentSearchChips"
import { TrendingTopicsRow } from "@/components/dashboard/TrendingTopicsRow"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { LoadingState } from "@/components/ui/LoadingState"
import {
  getRecentSearches,
  removeRecentSearch,
} from "@/lib/recentSearchStorage"

export function DashboardPage() {
  const [recent, setRecent] = useState(getRecentSearches)

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: getDashboardOverview,
  })

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Trending opinions and social media pulse"
    >
      {isLoading || !data ? (
        <LoadingState label="Loading dashboard…" />
      ) : (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              value={data.stats.searches_today.value}
              subtitle={data.stats.searches_today.subtitle}
              trend={data.stats.searches_today.trend}
              trendPositive={data.stats.searches_today.trend_positive}
              icon={Search}
            />
            <MetricCard
              value={data.stats.topics_trending.value}
              subtitle={data.stats.topics_trending.subtitle}
              trend={data.stats.topics_trending.trend}
              trendPositive={data.stats.topics_trending.trend_positive}
              icon={TrendingUp}
            />
            <MetricCard
              value={data.stats.positive_sentiment.value}
              subtitle={data.stats.positive_sentiment.subtitle}
              icon={ThumbsUp}
              progress={data.stats.positive_sentiment.progress}
              progressColor="green"
            />
            <MetricCard
              value={data.stats.negative_sentiment.value}
              subtitle={data.stats.negative_sentiment.subtitle}
              icon={ThumbsDown}
              progress={data.stats.negative_sentiment.progress}
              progressColor="red"
            />
          </div>

          <TrendingTopicsRow topics={data.trending_topics} />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <DebateList debates={data.debates} />
            </div>
            <div className="lg:col-span-2">
              <PlatformPulsePanel items={data.platform_pulse} />
            </div>
          </div>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              Your Recent Searches
            </h2>
            <RecentSearchChips
              items={recent}
              onRemove={(q) => setRecent(removeRecentSearch(q))}
            />
          </section>
        </div>
      )}
    </DashboardLayout>
  )
}
