import type { MouseEvent } from "react"
import { useNavigate } from "react-router-dom"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Plus,
} from "lucide-react"
import { useTopicsTable } from "@/hooks/useTopicsTable"
import { useIsMobile, useIsTablet } from "@/hooks/useMediaQuery"
import { platformBrandColor } from "@/lib/platformBrandColors"
import { dashCardStatic } from "@/lib/dash-classes"
import type { SortField, TopicRow } from "@/types/dashboard"
import { cn } from "@/lib/utils"

const TIMEFRAMES = ["24h", "7d", "30d"] as const

export function TopicsTable() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const {
    topics,
    loading,
    sortBy,
    sortOrder,
    timeframe,
    setTimeframe,
    toggleSort,
  } = useTopicsTable()

  function openTopic(name: string) {
    navigate(`/search?q=${encodeURIComponent(name)}`)
  }

  return (
    <div
      className={cn(
        dashCardStatic,
        "overflow-hidden"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--dash-border)] px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--dash-text)]">
            Trending topics
          </h2>
          <p className="mt-0.5 text-[12px] text-[var(--dash-text-mid)]">
            Ranked by engagement across all platforms
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[var(--dash-surface-alt)] p-0.5">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "cursor-pointer rounded-md border-none px-3 py-1.5 text-[12.5px] font-medium transition-all duration-150",
                  timeframe === tf
                    ? "bg-[var(--dash-surface)] text-[var(--dash-text)] shadow-[var(--dash-shadow)]"
                    : "bg-transparent text-[var(--dash-text-faint)]"
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isMobile ? (
        <div>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <MobileSkeleton key={i} />
              ))
            : topics.map((topic) => (
                <TopicCardMobile
                  key={topic.id}
                  topic={topic}
                  onExplore={() => openTopic(topic.name)}
                />
              ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="border-b border-[var(--dash-border)]">
                <TableHeaderCell label="Topic" width="26%" align="left" />
                <TableHeaderCell
                  label="Mentions"
                  width="14%"
                  align="right"
                  sortable
                  field="mentions"
                  activeSortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={toggleSort}
                />
                <TableHeaderCell
                  label={`Volume (${timeframe})`}
                  width="22%"
                  align="left"
                />
                <TableHeaderCell
                  label="Sentiment"
                  width="16%"
                  align="right"
                  sortable
                  field="sentiment"
                  activeSortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={toggleSort}
                />
                {!isTablet && (
                  <TableHeaderCell label="Platforms" width="12%" align="left" />
                )}
                <TableHeaderCell label="" width="10%" align="right" />
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonRow key={i} cols={isTablet ? 5 : 6} />
                  ))
                : topics.map((topic) => (
                    <TopicRowDesktop
                      key={topic.id}
                      topic={topic}
                      showPlatforms={!isTablet}
                      onOpen={() => openTopic(topic.name)}
                    />
                  ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && topics.length === 0 && (
        <div className="px-5 py-12 text-center">
          <p className="text-sm font-medium text-[var(--dash-text-mid)]">
            Nothing trending yet
          </p>
          <p className="mt-1 text-[13px] text-[var(--dash-text-faint)]">
            Run a search to start tracking topics
          </p>
        </div>
      )}
    </div>
  )
}

function TableHeaderCell({
  label,
  width,
  align,
  sortable,
  field,
  activeSortBy,
  sortOrder,
  onSort,
}: {
  label: string
  width: string
  align: "left" | "right"
  sortable?: boolean
  field?: SortField
  activeSortBy?: SortField
  sortOrder?: "asc" | "desc"
  onSort?: (field: SortField) => void
}) {
  const isActive = Boolean(sortable && field && field === activeSortBy)

  return (
    <th
      onClick={() => sortable && field && onSort?.(field)}
      style={{ width }}
      className={cn(
        "px-4 py-3 text-[11.5px] font-semibold uppercase tracking-[0.04em] whitespace-nowrap",
        align === "right" ? "text-right" : "text-left",
        isActive ? "text-[var(--dash-accent)]" : "text-[var(--dash-text-faint)]",
        sortable && "cursor-pointer select-none"
      )}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1",
          align === "right" && "flex-row-reverse"
        )}
      >
        {label}
        {sortable &&
          (isActive ? (
            sortOrder === "desc" ? (
              <ChevronDown className="size-3.5" strokeWidth={2} />
            ) : (
              <ChevronUp className="size-3.5" strokeWidth={2} />
            )
          ) : (
            <ChevronsUpDown className="size-3.5 opacity-40" strokeWidth={2} />
          ))}
      </span>
    </th>
  )
}

function TopicSparkline({
  topic,
  className,
  maxWidth = "140px",
}: {
  topic: TopicRow
  className?: string
  maxWidth?: string
}) {
  return (
    <div className={cn("h-9", className)} style={{ width: "100%", maxWidth }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={topic.sparkline_data}
          margin={{ top: 2, right: 0, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id={`spark-${topic.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--dash-accent)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--dash-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="mentions"
            stroke="var(--dash-accent)"
            strokeWidth={1.5}
            fill={`url(#spark-${topic.id})`}
            isAnimationActive={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--dash-surface)",
              border: "1px solid var(--dash-border)",
              borderRadius: "8px",
              fontSize: "11px",
              padding: "6px 10px",
            }}
            labelStyle={{ color: "var(--dash-text-faint)" }}
            itemStyle={{ color: "var(--dash-text)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function TopicRowDesktop({
  topic,
  showPlatforms,
  onOpen,
}: {
  topic: TopicRow
  showPlatforms: boolean
  onOpen: () => void
}) {
  const isPositive =
    topic.sentiment_positive_pct >= topic.sentiment_negative_pct
  const directionSymbol =
    topic.direction === "up" ? "↑" : topic.direction === "down" ? "↓" : "→"

  return (
    <tr
      className="cursor-pointer border-b border-[var(--dash-border)] transition-colors duration-150 hover:bg-[var(--dash-surface-alt)]"
      onClick={onOpen}
    >
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--dash-text)]">
            {topic.name}
          </span>
          {topic.is_heated_debate && (
            <span className="rounded-[5px] bg-[var(--dash-neg-soft)] px-[7px] py-0.5 text-[10px] font-bold uppercase tracking-[0.02em] text-[var(--dash-neg)]">
              Heated
            </span>
          )}
        </div>
      </td>

      <td className="px-4 py-3.5 text-right">
        <div className="text-base font-bold tabular-nums text-[var(--dash-text)]">
          {topic.mention_count.toLocaleString()}
        </div>
        <div
          className={cn(
            "mt-0.5 text-[11.5px] font-medium",
            topic.direction === "down"
              ? "text-[var(--dash-neg)]"
              : topic.direction === "up"
                ? "text-[var(--dash-pos)]"
                : "text-[var(--dash-text-faint)]"
          )}
        >
          {directionSymbol} {topic.direction_pct}%
        </div>
      </td>

      <td className="px-4 py-3.5">
        <TopicSparkline topic={topic} maxWidth={showPlatforms ? "140px" : "100px"} />
      </td>

      <td className="px-4 py-3.5 text-right">
        <div className="inline-flex items-center justify-end gap-1.5">
          <div className="h-1 w-12 overflow-hidden rounded-sm bg-[var(--dash-surface-alt)]">
            <div
              className="h-full"
              style={{
                width: `${topic.sentiment_positive_pct}%`,
                background: isPositive ? "var(--dash-pos)" : "var(--dash-neg)",
              }}
            />
          </div>
          <span
            className="min-w-9 text-[12.5px] font-semibold"
            style={{
              color: isPositive ? "var(--dash-pos)" : "var(--dash-neg)",
            }}
          >
            {topic.sentiment_positive_pct}%
          </span>
        </div>
      </td>

      {showPlatforms && (
        <td className="px-4 py-3.5">
          <PlatformDots topic={topic} />
        </td>
      )}

      <td className="px-4 py-3.5 text-right">
        <ExploreButton
          onClick={(e) => {
            e.stopPropagation()
            onOpen()
          }}
        />
      </td>
    </tr>
  )
}

function PlatformDots({ topic }: { topic: TopicRow }) {
  return (
    <div className="flex items-center">
      {topic.platforms.slice(0, 4).map((p, i) => (
        <span
          key={`${p}-${i}`}
          title={p}
          className="size-2 rounded-full border-[1.5px] border-[var(--dash-surface)]"
          style={{
            background: platformBrandColor(p),
            marginLeft: i > 0 ? -3 : 0,
          }}
        />
      ))}
      {topic.platform_count > 4 && (
        <span className="ml-1 text-[11px] text-[var(--dash-text-faint)]">
          +{topic.platform_count - 4}
        </span>
      )}
    </div>
  )
}

function ExploreButton({ onClick }: { onClick: (e: MouseEvent) => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1.5",
        "border-[var(--dash-accent-border)] bg-[var(--dash-accent-soft)] text-xs font-semibold text-[var(--dash-accent)]",
        "cursor-pointer transition-all duration-150",
        "hover:border-[var(--dash-accent)] hover:bg-[var(--dash-accent)] hover:text-white"
      )}
    >
      <Plus className="size-3" strokeWidth={2} />
      Explore
    </button>
  )
}

function TopicCardMobile({
  topic,
  onExplore,
}: {
  topic: TopicRow
  onExplore: () => void
}) {
  const isPositive =
    topic.sentiment_positive_pct >= topic.sentiment_negative_pct

  return (
    <div className="border-b border-[var(--dash-border)] px-4 py-3.5">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold text-[var(--dash-text)]">
              {topic.name}
            </span>
            {topic.is_heated_debate && (
              <span className="rounded bg-[var(--dash-neg-soft)] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[var(--dash-neg)]">
                Heated
              </span>
            )}
          </div>
          <span className="text-xs text-[var(--dash-text-faint)]">
            {topic.mention_count.toLocaleString()} mentions
          </span>
        </div>
        <ExploreButton
          onClick={(e) => {
            e.stopPropagation()
            onExplore()
          }}
        />
      </div>

      <div className="flex items-center gap-3">
        <TopicSparkline topic={topic} className="w-[90px] shrink-0" maxWidth="90px" />
        <div className="h-1 flex-1 overflow-hidden rounded-sm bg-[var(--dash-surface-alt)]">
          <div
            className="h-full rounded-sm"
            style={{
              width: `${topic.sentiment_positive_pct}%`,
              background: isPositive ? "var(--dash-pos)" : "var(--dash-neg)",
            }}
          />
        </div>
        <span
          className="text-xs font-semibold"
          style={{ color: isPositive ? "var(--dash-pos)" : "var(--dash-neg)" }}
        >
          {topic.sentiment_positive_pct}%
        </span>
      </div>
    </div>
  )
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-[var(--dash-border)]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div
            className="dash-skeleton h-3.5 rounded bg-[var(--dash-surface-alt)]"
            style={{ width: i === 0 ? "70%" : "50%" }}
          />
        </td>
      ))}
    </tr>
  )
}

function MobileSkeleton() {
  return (
    <div className="border-b border-[var(--dash-border)] px-4 py-3.5">
      <div className="dash-skeleton mb-2 h-4 w-2/3 rounded bg-[var(--dash-surface-alt)]" />
      <div className="dash-skeleton h-7 w-full rounded bg-[var(--dash-surface-alt)]" />
    </div>
  )
}
