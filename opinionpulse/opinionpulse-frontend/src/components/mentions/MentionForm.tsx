import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { ApiError } from "@/api/client"
import { createMention } from "@/api/mentions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { btnPrimary, inputSurface, panelSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

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
    <Card className={panelSurface}>
      <CardHeader>
        <CardTitle className="text-foreground">Add manual mention</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            placeholder="Author (optional)"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className={inputSurface}
          />
          <textarea
            placeholder="Mention text (required)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            required
            className={cn(
              "w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              inputSurface
            )}
          />
          <Input
            placeholder="URL (optional)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={inputSurface}
          />
          <Input
            type="number"
            placeholder="Engagement score (optional)"
            value={engagement}
            onChange={(e) => setEngagement(e.target.value)}
            className={inputSurface}
            min={0}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="submit"
            disabled={mutation.isPending}
            className={cn("gap-2", btnPrimary)}
          >
            <Plus className="size-4" />
            {mutation.isPending ? "Adding…" : "Add mention"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
