import { ExternalLink } from "lucide-react"
import type { WikiSummary } from "@/lib/api/types"

type WikipediaSummaryCardProps = {
  wiki: WikiSummary
}

export function WikipediaSummaryCard({ wiki }: WikipediaSummaryCardProps) {
  return (
    <div className="rounded-xl border border-violet-200 bg-gradient-to-r from-sky-50 to-violet-50 p-5">
      <div className="flex flex-row gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">
            📖 Wikipedia
          </p>
          <h3 className="mt-1 text-base font-bold text-foreground">{wiki.title}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-600">
            {wiki.summary}
          </p>
          <a
            href={wiki.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-violet-800 hover:underline"
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
