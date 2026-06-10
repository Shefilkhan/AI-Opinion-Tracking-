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
import {
  cardSurface,
  chartColors,
  chartTooltipLabelStyle,
  chartTooltipStyle,
} from "@/lib/ui-classes"
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
    <section className="border-y border-border bg-background py-24 md:py-32">
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
              className={cn(cardSurface)}
            >
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className={cn(cardSurface)}>
          <CardHeader>
            <CardTitle className="text-foreground">Sentiment Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sentimentChartData}>
                  <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke={chartColors.axis} tick={{ fontSize: 12 }} />
                  <YAxis stroke={chartColors.axis} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    labelStyle={chartTooltipLabelStyle}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="positive"
                    stroke={chartColors.positive}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="neutral"
                    stroke={chartColors.neutral}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="negative"
                    stroke={chartColors.negative}
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
