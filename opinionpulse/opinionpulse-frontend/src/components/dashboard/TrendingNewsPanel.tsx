import { Link } from "react-router-dom"
import { ExternalLink, Newspaper } from "lucide-react"
import type { TrendingItem } from "@/api/dashboard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cardSurface } from "@/lib/ui-classes"

type TrendingNewsPanelProps = {
  items: TrendingItem[]
  message?: string
}

export function TrendingNewsPanel({ items, message }: TrendingNewsPanelProps) {
  return (
    <Card className={cardSurface}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Newspaper className="size-5 text-primary" />
          Trending public opinion topics
        </CardTitle>
        {message && <p className="text-xs text-muted-foreground">{message}</p>}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Trending news is temporarily unavailable. Check GDELT rate limits or try
            again later.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item, i) => (
              <li
                key={`${item.title}-${i}`}
                className="rounded-lg border border-gray-200 bg-background/40 p-4"
              >
                <p className="font-medium text-foreground line-clamp-2">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.source}
                  {item.published_at &&
                    ` · ${new Date(item.published_at).toLocaleDateString()}`}
                </p>
                <p className="mt-1 text-xs text-primary">
                  Keyword: {item.suggested_keyword}
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button
                    render={
                      <Link
                        to={`/projects/new?keyword=${encodeURIComponent(item.suggested_keyword)}`}
                      />
                    }
                    variant="outline"
                    className="h-11 w-full sm:h-8 sm:w-auto"
                  >
                    Track this topic
                  </Button>
                  {item.url && (
                    <Button
                      variant="ghost"
                      className="h-11 w-full gap-1 text-primary sm:h-8 sm:w-auto"
                      render={
                        <a href={item.url!} target="_blank" rel="noopener noreferrer" />
                      }
                    >
                      <ExternalLink className="size-3.5" />
                      Open article
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
