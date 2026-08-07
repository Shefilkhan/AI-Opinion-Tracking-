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
import { cn } from "@/lib/utils"

type MarketPriceChartProps = {
  data: MarketChartResponse | undefined
  loading?: boolean
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

export function MarketPriceChart({ data, loading }: MarketPriceChartProps) {
  const chartData = useMemo(() => data?.points ?? [], [data?.points])

  const isUp = (data?.change_pct ?? 0) >= 0
  const stroke = isUp ? "#10b981" : "#ef4444"
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
        <p className="text-sm font-medium text-[var(--dash-text)]">No market chart for this keyword</p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-[var(--dash-text-faint)]">
          {data?.message ??
            "Use crypto names (Bitcoin, Ethereum) or public companies (Apple, Tesla, NVDA). Private companies like OpenAI have no stock ticker."}
        </p>
      </div>
    )
  }

  const TypeIcon = data.asset_type === "crypto" ? Bitcoin : Building2
  const typeLabel = data.asset_type === "crypto" ? "Cryptocurrency" : "Company stock"

  return (
    <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg",
              data.asset_type === "crypto"
                ? "bg-amber-500/15 text-amber-600"
                : "bg-blue-500/15 text-blue-600"
            )}
          >
            <TypeIcon className="size-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-semibold text-[var(--dash-text)]">
                {data.symbol ?? data.name}
              </h4>
              <span className="rounded-full border border-[var(--dash-border)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--dash-text-faint)]">
                {typeLabel}
              </span>
            </div>
            <p className="text-xs text-[var(--dash-text-faint)]">
              {data.asset_type === "crypto" ? "7-day price (CoinGecko)" : "5-day price (Yahoo Finance)"}
            </p>
          </div>
        </div>

        {data.current_price != null && (
          <div className="text-right">
            <p className="text-xl font-bold tracking-tight text-[var(--dash-text)]">
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

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="marketUp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="marketDown" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--dash-border)" opacity={0.5} />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "var(--dash-text-faint)" }}
              interval="preserveStartEnd"
              minTickGap={24}
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
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value) => [formatPrice(Number(value), data.currency), "Price"]}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={stroke}
              strokeWidth={2}
              fill={`url(#${fillId})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
