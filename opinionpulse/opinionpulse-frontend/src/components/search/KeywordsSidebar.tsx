import { useNavigate } from "react-router-dom"
import type { SearchResponse } from "@/lib/api/types"

type KeywordsSidebarProps = {
  data: SearchResponse
}

export function KeywordsSidebar({ data }: KeywordsSidebarProps) {
  const navigate = useNavigate()

  return (
    <aside className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white dark:border-[#2d2d44] dark:bg-[#1e1e30] p-5">
        <h3 className="text-sm font-semibold text-foreground">Top Keywords</h3>
        <ol className="mt-3 space-y-2">
          {data.trending_keywords.map((k, i) => (
            <li key={k.word} className="flex justify-between text-sm">
              <span>
                {i + 1}. {k.word}
              </span>
              <span className="text-muted-foreground">
                {k.count.toLocaleString()}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white dark:border-[#2d2d44] dark:bg-[#1e1e30] p-5">
        <h3 className="text-sm font-semibold text-foreground">Related Topics</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {data.related_topics.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() =>
                navigate(`/search?q=${encodeURIComponent(t.replace(/^#/, ""))}`)
              }
              className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium hover:border-primary hover:text-primary"
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
