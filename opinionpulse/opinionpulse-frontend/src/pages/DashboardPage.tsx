import { useState } from "react"
import { Search, ThumbsDown, ThumbsUp, TrendingUp } from "lucide-react"
import { useDashboard } from "@/hooks/useDashboard"
import { pageShell, sectionTitle } from "@/lib/ui-classes"
import { AiInsightOfTheDay } from "@/components/dashboard/AiInsightOfTheDay"
import { DebateList } from "@/components/dashboard/DebateList"
import { LiveDataIndicator } from "@/components/dashboard/LiveDataIndicator"
import { LiveDebates } from "@/components/dashboard/LiveDebates"
import { MetricCard } from "@/components/dashboard/MetricCard"
import { MostDiscussed } from "@/components/dashboard/MostDiscussed"
import { PlatformPulsePanel } from "@/components/dashboard/PlatformPulsePanel"
import { RecentSearchChips } from "@/components/dashboard/RecentSearchChips"
import { TrendingTopicsRow } from "@/components/dashboard/TrendingTopicsRow"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import {
  getRecentSearches,
  removeRecentSearch,
} from "@/lib/recentSearchStorage"
import { getSelectedPlan, planDisplayName } from "@/lib/planStorage"
import { cn } from "@/lib/utils"

export function DashboardPage() {
  const [recent, setRecent] = useState(getRecentSearches)
  const selectedPlan = getSelectedPlan()

  const { data, isLoading, isFetching, refetch } = useDashboard()

  return (
    <div className={pageShell}>
      <div className="relative z-10">
        <DashboardLayout
          title="Dashboard"
          subtitle="Trending opinions and social media pulse"
        >
      {isLoading && !data ? (
        <div className="flex w-full flex-col gap-6 lg:gap-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-xl bg-muted"
              />
            ))}
          </div>
          <div className="h-36 animate-pulse rounded-xl bg-muted" />
          <LiveDebates isLoading />
          <MostDiscussed isLoading />
        </div>
      ) : data ? (
        <div className="flex w-full flex-col gap-6 lg:gap-8">
          <LiveDataIndicator
            isLive={data.is_live ?? {}}
            lastUpdated={data.last_updated}
          />
          {selectedPlan && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              🚧 Payment processing coming soon. You have full{" "}
              <strong>{planDisplayName(selectedPlan)}</strong> access during our
              beta.
            </p>
          )}
          {data.demo_mode && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Some feeds are empty — add API keys in backend{" "}
              <code className="text-[11px]">.env.local</code> for full live coverage.
            </p>
          )}
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

          <AiInsightOfTheDay />

          <LiveDebates
            debates={data.live_debates ?? []}
            isRefreshing={isFetching}
            lastUpdated={data.last_updated}
            onRefresh={() => void refetch()}
          />

          <MostDiscussed
            items={data.most_discussed ?? []}
            isRefreshing={isFetching}
            lastUpdated={data.last_updated}
            onRefresh={() => void refetch()}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-8">
            <div className="lg:col-span-3">
              <DebateList debates={data.debates} />
            </div>
            <div className="lg:col-span-2">
              <PlatformPulsePanel items={data.platform_pulse} />
            </div>
          </div>

          <section>
            <h2 className={cn(sectionTitle, "mb-3")}>
              Your Recent Searches
            </h2>
            <RecentSearchChips
              items={recent}
              onRemove={(q) => setRecent(removeRecentSearch(q))}
            />
          </section>
        </div>
      ) : null}
        </DashboardLayout>
      </div>
    </div>
  )
}
