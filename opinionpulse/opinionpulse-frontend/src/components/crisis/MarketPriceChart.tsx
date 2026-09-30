import { useMemo } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Bitcoin, Building2, Loader2, TrendingDown, TrendingUp } from "lucide-react"
import type { MarketChartResponse } from "@/api/market"
import { CrisisStatusBadge } from "@/components/crisis/CrisisStatusBadge"
import type { CrisisQuadrant } from "@/api/crisis"
import { formatMentionsDelta } from "@/lib/crisis-display"
import type { RadarPoint } from "@/api/crisis"
import { cn } from "@/lib/utils"

type MarketPriceChartProps = {
  data: MarketChartResponse | undefined
  loading?: boolean
  watchPoint?: Pick<
    RadarPoint,
    "keyword" | "quadrant" | "negative_pct_30m" | "mention_count_30m" | "baseline_mentions_30m"
  > | null
}

function formatPrice(value: number, currency: string) {
  if (value >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value)
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 1 ? 4 : 2,
  }).format(value)
}

export function MarketPriceChart({ data, loading, watchPoint }: MarketPriceChartProps) {
  const chartData = useMemo(() => data?.points ?? [], [data?.points])
  const isUp = (data?.change_pct ?? 0) >= 0
  const stroke = isUp ? "var(--dash-accent)" : "#dc2626"
  const fillId = isUp ? "marketUp" : "marketDown"

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-[var(--dash-border)]">
        <Loader2 className="size-6 animate-spin text-[var(--dash-accent)]" />
      </div>
    )
  }

  if (!data || data.asset_type === "unknown" || chartData.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--dash-border)] bg-[var(--dash-bg)] px-4 py-8 text-center">
        <p className="text-sm font-medium text-[var(--dash-text)]">No market chart for this topic</p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-[var(--dash-text-faint)]">
          {data?.message ??
            "Use crypto names (Bitcoin, Ethereum) or public companies (Apple, Tesla). General topics have no ticker."}
        </p>
      </div>
    )
  }

  const TypeIcon = data.asset_type === "crypto" ? Bitcoin : Building2
  const periodLabel = data.asset_type === "crypto" ? "7-day price" : "5-day price"

  return (
    <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg",
              data.asset_type === "crypto"
                ? "bg-amber-500/10 text-amber-600"
                : "bg-blue-500/10 text-blue-600"
            )}
          >
            <TypeIcon className="size-5" />
          </div>
          <div>
            <p className="crisis-mini-label m-0">Market context</p>
            <h4 className="mt-0.5 font-semibold text-[var(--dash-text)]">
              {data.symbol ?? data.name}
            </h4>
            <p className="text-xs text-[var(--dash-text-faint)]">{periodLabel}</p>
          </div>
        </div>

        {data.current_price != null && (
          <div className="text-right">
            <p className="text-2xl font-bold tracking-tight text-[var(--dash-text)]">
              {formatPrice(data.current_price, data.currency)}
            </p>
            {data.change_pct != null && (
              <p
                className={cn(
                  "mt-0.5 flex items-center justify-end gap-1 text-sm font-semibold",
                  isUp ? "text-emerald-600" : "text-red-600"
                )}
              >
                {isUp ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                {isUp ? "+" : ""}
                {data.change_pct}%
              </p>
            )}
          </div>
        )}
      </div>

      {watchPoint && (
        <div className="mb-4 grid grid-cols-3 gap-2 rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-3 text-center">
          <div>
            <p className="crisis-mini-label">Conversation</p>
            <p className="text-sm font-semibold text-[var(--dash-text)]">
              {formatMentionsDelta(watchPoint as RadarPoint) ?? `${watchPoint.mention_count_30m} mentions`}
            </p>
          </div>
          <div>
            <p className="crisis-mini-label">Negative share</p>
            <p className="text-sm font-semibold text-[var(--dash-text)]">
              {watchPoint.negative_pct_30m}%
            </p>
          </div>
          <div>
            <p className="crisis-mini-label">Risk status</p>
            <div className="mt-0.5 flex justify-center">
              <CrisisStatusBadge quadrant={watchPoint.quadrant as CrisisQuadrant} size="sm" />
            </div>
          </div>
        </div>
      )}

      <p className="mb-2 text-[10px] text-[var(--dash-text-faint)]">
        Concurrent movement — not causation
      </p>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="marketUp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--dash-accent)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--dash-accent)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="marketDown" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#dc2626" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#dc2626" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--dash-border)" opacity={0.45} />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "var(--dash-text-faint)" }}
              interval="preserveStartEnd"
              minTickGap={28}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "var(--dash-text-faint)" }}
              width={56}
              tickFormatter={(v) =>
                v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${Number(v).toFixed(0)}`
              }
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                background: "var(--dash-surface)",
                border: "1px solid var(--dash-border)",
                borderRadius: 10,
                fontSize: 12,
              }}
              formatter={(value) => [formatPrice(Number(value), data.currency), "Price"]}
              labelFormatter={(label) => String(label)}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={stroke}
              strokeWidth={2}
              fill={`url(#${fillId})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: stroke }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
