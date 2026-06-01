import { useQuery } from "@tanstack/react-query"
import { Hash, Layers, Loader2, MessageSquare, Sparkles, Target, TrendingUp } from "lucide-react"
import { getAnalyticsOverview } from "@/api/analytics"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cardSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"
type AnalyticsOverviewCardsProps = {
  projectId: number
}

export function AnalyticsOverviewCards({ projectId }: AnalyticsOverviewCardsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics-overview", projectId],
    queryFn: () => getAnalyticsOverview(projectId),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!data) return null

  const cards = [
    {
      label: "Total Mentions",
      value: data.total_mentions,
      icon: MessageSquare,
      color: "text-primary",
    },
    {
      label: "Total Analyzed",
      value: data.total_analyzed,
      icon: Sparkles,
      color: "text-primary",
    },
    {
      label: "Positive %",
      value: `${data.positive_percentage}%`,
      sub: `${data.positive} mentions`,
      icon: TrendingUp,
      color: "text-success",
    },
    {
      label: "Negative %",
      value: `${data.negative_percentage}%`,
      sub: `${data.negative} mentions`,
      icon: TrendingUp,
      color: "text-destructive",
    },
    {
      label: "Average Score",
      value: `${data.average_score >= 0 ? "+" : ""}${data.average_score.toFixed(2)}`,
      icon: Target,
      color: "text-foreground/80",
    },
    {
      label: "Top Source",
      value: data.top_source ?? "—",
      icon: Layers,
      color: "text-primary",
      capitalize: true,
    },
    {
      label: "Top Sentiment",
      value: data.top_sentiment ?? "—",
      icon: Sparkles,
      color: "text-primary",
      capitalize: true,
    },
    {
      label: "Keywords",
      value: data.keyword_count,
      icon: Hash,
      color: "text-muted-foreground",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.label} className={cardSurface}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Icon className={cn("size-4", card.color)} />
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={cn(
                  "text-2xl font-bold text-foreground",
                  card.capitalize && "capitalize"
                )}
              >
                {card.value}
              </p>
              {"sub" in card && card.sub && (
                <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
