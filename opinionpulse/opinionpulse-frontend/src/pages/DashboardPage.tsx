import { useState } from "react"
import { Search, ThumbsDown, ThumbsUp, TrendingUp } from "lucide-react"
import { useDashboard } from "@/hooks/useDashboard"
import { pageShell } from "@/lib/ui-classes"
import { AiInsightOfTheDay } from "@/components/dashboard/AiInsightOfTheDay"
import { DebateList } from "@/components/dashboard/DebateList"
import { LiveDataIndicator } from "@/components/dashboard/LiveDataIndicator"
import { LiveDebates } from "@/components/dashboard/LiveDebates"
import { MostDiscussed } from "@/components/dashboard/MostDiscussed"
import { PlatformPulsePanel } from "@/components/dashboard/PlatformPulsePanel"
import { RecentSearchChips } from "@/components/dashboard/RecentSearchChips"
import { TrendingTopicsRow } from "@/components/dashboard/TrendingTopicsRow"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { InlineNotice } from "@/components/layout/InlineNotice"
import { PageSection } from "@/components/layout/PageSection"
import { StatCard } from "@/components/layout/StatCard"
import {
  getRecentSearches,
  removeRecentSearch,
} from "@/lib/recentSearchStorage"
import { getSelectedPlan, planDisplayName } from "@/lib/planStorage"

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
            <InlineNotice variant="warning" title="Beta access">
              Payment processing coming soon. You have full{" "}
              <strong>{planDisplayName(selectedPlan)}</strong> access during our
              beta.
            </InlineNotice>
          )}
          {data.demo_mode && (
            <InlineNotice variant="warning">
              Some feeds are empty — add API keys in backend{" "}
              <code className="text-[11px]">.env.local</code> for full live coverage.
            </InlineNotice>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              value={data.stats.searches_today.value}
              label={data.stats.searches_today.subtitle}
              trend={data.stats.searches_today.trend}
              trendPositive={data.stats.searches_today.trend_positive}
              icon={Search}
            />
            <StatCard
              value={data.stats.topics_trending.value}
              label={data.stats.topics_trending.subtitle}
              trend={data.stats.topics_trending.trend}
              trendPositive={data.stats.topics_trending.trend_positive}
              icon={TrendingUp}
            />
            <StatCard
              value={data.stats.positive_sentiment.value}
              label={data.stats.positive_sentiment.subtitle}
              icon={ThumbsUp}
              progress={data.stats.positive_sentiment.progress}
              progressColor="green"
            />
            <StatCard
              value={data.stats.negative_sentiment.value}
              label={data.stats.negative_sentiment.subtitle}
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

          <PageSection title="Your Recent Searches">
            <RecentSearchChips
              items={recent}
              onRemove={(q) => setRecent(removeRecentSearch(q))}
            />
          </PageSection>
        </div>
      ) : null}
        </DashboardLayout>
      </div>
    </div>
  )
}
