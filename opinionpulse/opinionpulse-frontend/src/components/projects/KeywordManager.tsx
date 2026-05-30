import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, X } from "lucide-react"
import { ApiError } from "@/api/client"
import {
  createKeyword,
  deleteKeyword,
  getProjectKeywords,
  type KeywordCreateData,
} from "@/api/keywords"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { inputSurface, panelSurface, selectSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

const KEYWORD_TYPES: KeywordCreateData["keyword_type"][] = [
  "brand",
  "product",
  "competitor",
  "topic",
  "hashtag",
  "person",
]

type KeywordManagerProps = {
  projectId: number
}

export function KeywordManager({ projectId }: KeywordManagerProps) {
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState("")
  const [keywordType, setKeywordType] = useState<KeywordCreateData["keyword_type"]>("topic")
  const [error, setError] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["project-keywords", projectId],
    queryFn: () => getProjectKeywords(projectId),
  })

  const addMutation = useMutation({
    mutationFn: () =>
      createKeyword(projectId, { keyword: keyword.trim(), keyword_type: keywordType }),
    onSuccess: () => {
      setKeyword("")
      setError(null)
      queryClient.invalidateQueries({ queryKey: ["project-keywords", projectId] })
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.detail : "Failed to add keyword")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteKeyword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-keywords", projectId] })
    },
  })

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!keyword.trim()) {
      setError("Enter a keyword")
      return
    }
    addMutation.mutate()
  }

  return (
    <div className={cn(panelSurface, "p-5")}>
      <h3 className="font-semibold text-white">Keywords</h3>
      <p className="mt-1 text-sm text-slate-400">Track brands, topics, and competitors.</p>

      <form onSubmit={handleAdd} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="e.g. Netflix pricing"
          className={cn("flex-1", inputSurface)}
        />
        <select
          value={keywordType}
          onChange={(e) =>
            setKeywordType(e.target.value as KeywordCreateData["keyword_type"])
          }
          className={cn(selectSurface, "sm:w-36")}
        >
          {KEYWORD_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <Button type="submit" disabled={addMutation.isPending} className="gap-2">
          <Plus className="size-4" />
          Add
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {isLoading && <p className="text-sm text-slate-500">Loading keywords…</p>}
        {data?.keywords.map((kw) => (
          <Badge
            key={kw.id}
            className="gap-2 border-slate-700 bg-slate-800 py-1.5 pl-3 pr-1 text-slate-200"
          >
            <span>
              {kw.keyword}{" "}
              <span className="text-slate-500">({kw.keyword_type})</span>
            </span>
            <button
              type="button"
              onClick={() => deleteMutation.mutate(kw.id)}
              className="rounded p-0.5 hover:bg-slate-700"
              aria-label={`Delete ${kw.keyword}`}
            >
              <X className="size-3.5 text-slate-400" />
            </button>
          </Badge>
        ))}
        {!isLoading && data?.keywords.length === 0 && (
          <p className="text-sm text-slate-500">No keywords yet.</p>
        )}
      </div>
    </div>
  )
}
