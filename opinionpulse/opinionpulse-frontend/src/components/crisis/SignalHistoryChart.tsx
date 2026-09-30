import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { CrisisEvent } from "@/api/crisis"
import { CrisisStatusBadge } from "@/components/crisis/CrisisStatusBadge"
import { eventsToSignalHistory, quadrantDisplayLabel } from "@/lib/crisis-display"
import { proCard } from "@/lib/ui-classes"

type SignalHistoryChartProps = {
  events: CrisisEvent[]
  currentVolume: number
  currentVelocity: number
}

export function SignalHistoryChart({
  events,
  currentVolume,
  currentVelocity,
}: SignalHistoryChartProps) {
  const history = eventsToSignalHistory(events)

  if (history.length === 0) {
    return (
      <section className={`${proCard} p-5 sm:p-6`}>
        <h3 className="crisis-section-label m-0">Signal history</h3>
        <p className="mt-3 text-sm text-[var(--dash-text-faint)]">
          Not enough scan history yet. Run additional scans to build a timeline.
        </p>
      </section>
    )
  }

  const chartData = history.map((h) => ({
    ...h,
    label: h.time,
  }))

  return (
    <section className={`${proCard} p-5 sm:p-6`}>
      <h3 className="crisis-section-label m-0">Signal history</h3>
      <p className="mt-1 text-xs text-[var(--dash-text-faint)]">
        Volume and velocity scores from recent scans
      </p>
      <div className="mt-4 h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--dash-border)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "var(--dash-text-faint)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "var(--dash-text-faint)" }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip
              contentStyle={{
                background: "var(--dash-surface)",
                border: "1px solid var(--dash-border)",
                borderRadius: 10,
                fontSize: 12,
              }}
              formatter={(value, name) => [value, name === "volumeScore" ? "Volume" : "Velocity"]}
              labelFormatter={(label) => String(label)}
            />
            <Line
              type="monotone"
              dataKey="volumeScore"
              stroke="var(--dash-accent)"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="volumeScore"
            />
            <Line
              type="monotone"
              dataKey="velocityScore"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="velocityScore"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[var(--dash-text-faint)]">
        <span>
          Current volume: <strong className="text-[var(--dash-text)]">{Math.round(currentVolume)}</strong>
        </span>
        <span>·</span>
        <span>
          Current velocity:{" "}
          <strong className="text-[var(--dash-text)]">{Math.round(currentVelocity)}</strong>
        </span>
      </div>

      {events.length > 0 && (
        <div className="mt-5 border-t border-[var(--dash-border)] pt-4">
          <p className="crisis-mini-label mb-2">Status history</p>
          <div className="flex flex-wrap gap-2">
            {[...events].slice(0, 6).map((e) => (
              <span
                key={e.id}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--dash-border)] bg-[var(--dash-bg)] px-2.5 py-1 text-[11px]"
              >
                <span className="text-[var(--dash-text-faint)]">
                  {new Date(e.created_at).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                <CrisisStatusBadge quadrant={e.quadrant} size="sm" />
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export function StatusHistoryChips({ events }: { events: CrisisEvent[] }) {
  if (!events.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {events.slice(0, 8).map((e) => (
        <span
          key={e.id}
          className="rounded-full border border-[var(--dash-border)] px-2 py-1 text-[11px] text-[var(--dash-text-mid)]"
        >
          {new Date(e.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}{" "}
          · {quadrantDisplayLabel(e.quadrant)}
        </span>
      ))}
    </div>
  )
}
