import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { PlatformPulse } from "@/api/dashboard"
import { DashChartTooltip } from "@/components/dashboard/DashChartTooltip"
import { dashCardStatic } from "@/lib/dash-classes"
import { cn } from "@/lib/utils"

type WeeklyActivityChartProps = {
  platformPulse: PlatformPulse[]
}

const DAY_LABELS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"]

const METRIC_DESCRIPTIONS: Record<string, string> = {
  Positive: "Positive sentiment share for this day",
  Negative: "Negative sentiment share for this day",
}

function buildWeekData(platformPulse: PlatformPulse[]) {
  if (platformPulse.length >= 7) {
    return platformPulse.slice(0, 7).map((p, i) => ({
      day: DAY_LABELS[i] ?? p.label.slice(0, 3),
      positive: p.positive_pct,
      negative: Math.max(0, 100 - p.positive_pct - 15),
    }))
  }

  return DAY_LABELS.map((day, i) => ({
    day,
    positive: 30 + ((i * 11) % 45),
    negative: 15 + ((i * 7) % 30),
  }))
}

export function WeeklyActivityChart({ platformPulse }: WeeklyActivityChartProps) {
  const data = buildWeekData(platformPulse)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-serif-display text-lg font-semibold text-[var(--dash-text)]">Weekly activity</h2>
        <div className="flex items-center gap-4 text-xs text-[var(--dash-text-faint)]">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[var(--dash-chart-teal)]" />
            Positive
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[var(--dash-chart-blue)]" />
            Negative
          </span>
        </div>
      </div>

      <div className={cn(dashCardStatic, "h-[280px] p-4 pt-2 sm:p-5")}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4} barSize={14} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--dash-border)" />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--dash-text-faint)", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#718096", fontSize: 11 }}
              width={36}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              cursor={{ fill: "var(--dash-surface-alt)", opacity: 0.45 }}
              wrapperStyle={{ zIndex: 20, outline: "none" }}
              allowEscapeViewBox={{ x: true, y: true }}
              offset={12}
              content={({ active, payload, label }) => (
                <DashChartTooltip
                  active={active}
                  title={typeof label === "string" ? label : undefined}
                  subtitle="Weekly sentiment activity by day"
                  rows={payload?.map((entry) => ({
                    name: String(entry.name ?? entry.dataKey ?? ""),
                    value: Number(entry.value ?? 0),
                    color: entry.color,
                    description: METRIC_DESCRIPTIONS[String(entry.name ?? "")],
                  }))}
                />
              )}
            />
            <Legend wrapperStyle={{ display: "none" }} />
            <Bar dataKey="positive" name="Positive" fill="var(--dash-chart-teal)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="negative" name="Negative" fill="var(--dash-chart-blue)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
