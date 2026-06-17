import { useState } from "react"

import { Search, ThumbsDown, ThumbsUp, TrendingUp } from "lucide-react"

import { useDashboard } from "@/hooks/useDashboard"

import { AiInsightOfTheDay } from "@/components/dashboard/AiInsightOfTheDay"

import { BetaAccessBanner } from "@/components/dashboard/BetaAccessBanner"

import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader"

import {

  DashboardStatCard,

  DashboardStatSkeleton,

} from "@/components/dashboard/DashboardStatCard"

import { DashboardSection } from "@/components/dashboard/DashboardSection"

import { DebateList } from "@/components/dashboard/DebateList"

import { LiveDataIndicator } from "@/components/dashboard/LiveDataIndicator"

import { LiveDebates } from "@/components/dashboard/LiveDebates"

import { PlatformPulsePanel } from "@/components/dashboard/PlatformPulsePanel"

import { RecentSearchChips } from "@/components/dashboard/RecentSearchChips"

import { TopicsTable } from "@/components/dashboard/TopicsTable"

import { DashboardLayout } from "@/components/layout/DashboardLayout"

import { dashCardStatic } from "@/lib/dash-classes"

import {

  getRecentSearches,

  removeRecentSearch,

} from "@/lib/recentSearchStorage"

import { getSelectedPlan } from "@/lib/planStorage"

import { cn } from "@/lib/utils"



export function DashboardPage() {

  const [recent, setRecent] = useState(getRecentSearches)

  const selectedPlan = getSelectedPlan()



  const { data, isLoading, isFetching, refetch } = useDashboard()



  return (

    <DashboardLayout hidePageHeader dashShell>

      {isLoading && !data ? (

        <div className="dashboard-shell flex flex-col">

          <DashboardPageHeader

            title="Dashboard"

            subtitle="Trending opinions and social media pulse"

          />

          <div className="mt-[var(--space-5)] grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">

            {[0, 1, 2, 3].map((i) => (

              <DashboardStatSkeleton key={i} />

            ))}

          </div>

          <div className="mt-[var(--space-5)]">

            <div className={cn(dashCardStatic, "h-14 animate-pulse bg-[var(--dash-surface-alt)]")} />

          </div>

          <div className="topics-table-wrapper">

            <div className={cn(dashCardStatic, "h-64 animate-pulse bg-[var(--dash-surface-alt)]")} />

          </div>

          <div className="mt-[var(--space-8)]">

            <LiveDebates isLoading />

          </div>

        </div>

      ) : data ? (

        <div className="flex flex-col">

          <DashboardPageHeader

            title="Dashboard"

            subtitle="Trending opinions and social media pulse"

            lastUpdated={data.last_updated}

          />



          <div className="mt-[var(--space-5)]">

            <LiveDataIndicator

              isLive={data.is_live ?? {}}

              lastUpdated={data.last_updated}

            />

          </div>



          {selectedPlan && (

            <div className="mt-[var(--space-4)]">

              <BetaAccessBanner plan={selectedPlan} />

            </div>

          )}



          {data.demo_mode && (

            <div

              className={cn(

                dashCardStatic,

                "mt-[var(--space-4)] px-4 py-3 text-[13px] text-[var(--dash-text-mid)]"

              )}

            >

              Some feeds are empty — add API keys in backend{" "}

              <code className="text-[11px] text-[var(--dash-text)]">.env.local</code>{" "}

              for full live coverage.

            </div>

          )}



          <div className="mt-[var(--space-5)] grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">

            <DashboardStatCard

              label="Searches today"

              value={data.stats.searches_today.value}

              description={data.stats.searches_today.subtitle}

              icon={Search}

              iconBg="var(--dash-accent-soft)"

              iconColor="var(--dash-accent)"

              barWidth="65%"

              barColor="var(--dash-accent)"

            />

            <DashboardStatCard

              label="Topics trending"

              value={data.stats.topics_trending.value}

              description={data.stats.topics_trending.subtitle}

              icon={TrendingUp}

              iconBg="var(--dash-blue-soft)"

              iconColor="var(--dash-blue)"

              barWidth="72%"

              barColor="var(--dash-blue)"

            />

            <DashboardStatCard

              label="Positive sentiment"

              value={data.stats.positive_sentiment.value}

              description={data.stats.positive_sentiment.subtitle}

              icon={ThumbsUp}

              iconBg="var(--dash-pos-soft)"

              iconColor="var(--dash-pos)"

              barWidth={`${data.stats.positive_sentiment.progress ?? 50}%`}

              barColor="var(--dash-pos)"

            />

            <DashboardStatCard

              label="Negative sentiment"

              value={data.stats.negative_sentiment.value}

              description={data.stats.negative_sentiment.subtitle}

              icon={ThumbsDown}

              iconBg="var(--dash-neg-soft)"

              iconColor="var(--dash-neg)"

              barWidth={`${data.stats.negative_sentiment.progress ?? 30}%`}

              barColor="var(--dash-neg)"

            />

          </div>



          <div className="topics-table-wrapper">

            <TopicsTable />

          </div>



          <AiInsightOfTheDay />



          <LiveDebates

            debates={data.live_debates ?? []}

            isRefreshing={isFetching}

            lastUpdated={data.last_updated}

            onRefresh={() => void refetch()}

          />



          <div className="grid grid-cols-1 gap-[var(--space-5)] lg:grid-cols-5 lg:gap-8">

            <div className="lg:col-span-3">

              <DebateList debates={data.debates} />

            </div>

            <div className="lg:col-span-2">

              <PlatformPulsePanel items={data.platform_pulse} />

            </div>

          </div>



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


