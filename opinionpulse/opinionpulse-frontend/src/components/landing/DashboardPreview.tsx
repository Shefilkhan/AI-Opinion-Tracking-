import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { dashboardStats, sentimentChartData } from "@/data/landingData"
import { SectionHeader } from "@/components/landing/SectionHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cardSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

const statItems = [
  { label: "Total Mentions", value: dashboardStats.totalMentions },
  { label: "Positive", value: dashboardStats.positive },
  { label: "Neutral", value: dashboardStats.neutral },
  { label: "Negative", value: dashboardStats.negative },
  { label: "Top Complaint", value: dashboardStats.topComplaint },
  { label: "Top Source", value: dashboardStats.topSource },
]

export function DashboardPreview() {
  return (
    <section className="border-y border-slate-800/50 bg-slate-900/30 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeader
          badge="Dashboard Preview"
          title="Analytics at a glance"
          description="Monitor mentions, sentiment breakdowns, and trends over time — all from one unified dashboard."
        />
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statItems.map((stat) => (
            <Card
              key={stat.label}
              className={cn(cardSurface, "bg-slate-950/50")}
            >
              <CardContent className="pt-6">
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-white">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className={cn(cardSurface, "bg-slate-950/50 shadow-xl")}>
          <CardHeader>
            <CardTitle className="text-white">Sentiment Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sentimentChartData}>
                  <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#e2e8f0" }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="positive"
                    stroke="#34d399"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="neutral"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="negative"
                    stroke="#fb7185"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
