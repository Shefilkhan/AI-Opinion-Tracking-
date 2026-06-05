import { useNavigate } from "react-router-dom"
import type { SearchResponse } from "@/lib/api/types"
import { proCard } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type KeywordsSidebarProps = {
  data: SearchResponse
}

export function KeywordsSidebar({ data }: KeywordsSidebarProps) {
  const navigate = useNavigate()

  return (
    <aside className="flex flex-col gap-5">
      <div className={cn(proCard, "p-5")}>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          Top Keywords
        </h3>
        <ol className="mt-4 space-y-2.5">
          {data.trending_keywords.map((k, i) => (
            <li
              key={k.word}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="truncate font-medium text-gray-800 dark:text-gray-200">
                <span className="mr-2 text-xs text-gray-400">{i + 1}.</span>
                {k.word}
              </span>
              <span className="shrink-0 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
                {k.count.toLocaleString()}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className={cn(proCard, "p-5")}>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          Related Topics
        </h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {data.related_topics.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() =>
                navigate(`/search?q=${encodeURIComponent(t.replace(/^#/, ""))}`)
              }
              className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-[#2d2d44] dark:bg-[#252538] dark:text-gray-300 dark:hover:border-purple-500/50 dark:hover:bg-purple-500/10 dark:hover:text-purple-300"
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
