import { ExternalLink } from "lucide-react"
import type { WikiSummary } from "@/lib/api/types"
import { proCard, cardTitle } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type WikipediaSummaryCardProps = {
  wiki: WikiSummary
}

export function WikipediaSummaryCard({ wiki }: WikipediaSummaryCardProps) {
  return (
    <div className={cn(proCard, "border-l-4 border-l-primary p-5")}>
      <div className="flex flex-row gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-primary">
            Wikipedia
          </p>
          <h3 className={cn(cardTitle, "mt-1")}>{wiki.title}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {wiki.summary}
          </p>
          <a
            href={wiki.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Read full article on Wikipedia
            <ExternalLink className="size-3.5" />
          </a>
        </div>
        {wiki.thumbnail && (
          <img
            src={wiki.thumbnail}
            alt={wiki.title}
            className="h-20 w-28 shrink-0 rounded-lg object-cover"
          />
        )}
      </div>
    </div>
  )
}
