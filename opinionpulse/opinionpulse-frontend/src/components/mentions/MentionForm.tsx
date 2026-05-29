import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { ApiError } from "@/api/client"
import { createMention } from "@/api/mentions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type MentionFormProps = {
  projectId: number
}

export function MentionForm({ projectId }: MentionFormProps) {
  const queryClient = useQueryClient()
  const [author, setAuthor] = useState("")
  const [text, setText] = useState("")
  const [url, setUrl] = useState("")
  const [engagement, setEngagement] = useState("")
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      createMention(projectId, {
        author: author.trim() || undefined,
        text: text.trim(),
        url: url.trim() || undefined,
        engagement_score: engagement ? Number(engagement) : 0,
      }),
    onSuccess: () => {
      setAuthor("")
      setText("")
      setUrl("")
      setEngagement("")
      setError(null)
      queryClient.invalidateQueries({ queryKey: ["mentions", projectId] })
      queryClient.invalidateQueries({ queryKey: ["mention-stats", projectId] })
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.detail : "Failed to add mention")
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) {
      setError("Text is required")
      return
    }
    mutation.mutate()
  }

  return (
    <Card className="border-slate-800/60 bg-slate-900/50">
      <CardHeader>
        <CardTitle className="text-white">Add manual mention</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            placeholder="Author (optional)"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="border-slate-700 bg-slate-950"
          />
          <textarea
            placeholder="Mention text (required)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <Input
            placeholder="URL (optional)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="border-slate-700 bg-slate-950"
          />
          <Input
            type="number"
            placeholder="Engagement score (optional)"
            value={engagement}
            onChange={(e) => setEngagement(e.target.value)}
            className="border-slate-700 bg-slate-950"
            min={0}
          />
          {error && <p className="text-sm text-rose-300">{error}</p>}
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white"
          >
            <Plus className="size-4" />
            {mutation.isPending ? "Adding…" : "Add mention"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
