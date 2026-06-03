import { useNavigate } from "react-router-dom"
import type { DebateItem } from "@/api/dashboard"
import { platformDisplayName } from "@/lib/api/sentiment"
import { cn } from "@/lib/utils"

type DebateListProps = {
  debates: DebateItem[]
}

const platformBadge: Record<string, string> = {
  twitter: "bg-sky-100 text-sky-800",
  reddit: "bg-orange-100 text-orange-800",
  youtube: "bg-red-100 text-red-800",
  news: "bg-gray-100 text-gray-800",
}

export function DebateList({ debates }: DebateListProps) {
  const navigate = useNavigate()

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        Latest Opinion Debates
      </h2>
      <ul className="divide-y divide-gray-200">
        {debates.map((d) => (
          <li key={d.id}>
            <button
              type="button"
              onClick={() => navigate(`/search?q=${encodeURIComponent(d.query)}`)}
              className="w-full py-4 text-left transition-colors hover:bg-gray-50/80"
            >
              <p className="text-[15px] font-semibold text-foreground">{d.title}</p>
              <span
                className={cn(
                  "mt-2 inline-block rounded px-2 py-0.5 text-[11px] font-medium",
                  platformBadge[d.platform] ?? "bg-gray-100 text-gray-700"
                )}
              >
                {platformDisplayName(d.platform)}
              </span>
              <p className="mt-2 line-clamp-2 text-[13px] text-gray-600">{d.summary}</p>
              <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="bg-green-500"
                  style={{ width: `${d.positive_pct}%` }}
                  title={`${d.positive_pct}% positive`}
                />
                <div
                  className="bg-red-500"
                  style={{ width: `${d.negative_pct}%` }}
                  title={`${d.negative_pct}% negative`}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{d.time_ago}</p>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
