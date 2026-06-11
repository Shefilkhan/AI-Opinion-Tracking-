import { useState } from "react"
import { AlertTriangle, Bot, CheckCircle2, ChevronRight, XCircle } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { generateCrisisResponse, type AiCrisisResponse } from "@/api/ai"
import { Button } from "@/components/ui/button"
import { btnPrimary } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

export function AiCrisisResponseModal({
  topic,
  results,
  isOpen,
  onClose,
}: {
  topic: string
  results: any[]
  isOpen: boolean
  onClose: () => void
}) {
  const [response, setResponse] = useState<AiCrisisResponse | null>(null)

  const mutation = useMutation({
    mutationFn: () => generateCrisisResponse({ topic, results }),
    onSuccess: (data) => setResponse(data.response),
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">AI Crisis Response</h2>
              <p className="text-sm text-muted-foreground">Managing negative sentiment for "{topic}"</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-muted text-muted-foreground">
            ✕
          </button>
        </div>

        <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
          {!response && !mutation.isPending && (
            <div className="text-center py-8">
              <Bot className="mx-auto size-12 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Generate PR Strategy</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Our AI will analyze the negative mentions and generate a professional PR statement and crisis strategy.
              </p>
              <Button onClick={() => mutation.mutate()} className={btnPrimary}>
                Generate Response
              </Button>
            </div>
          )}

          {mutation.isPending && (
            <div className="text-center py-12">
              <div className="inline-block size-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4"></div>
              <p className="text-muted-foreground animate-pulse">Analyzing crisis and drafting PR statement...</p>
            </div>
          )}

          {response && (
            <div className="space-y-6">
              <div className="rounded-xl bg-red-500/10 p-4 border border-red-500/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="size-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-500 capitalize">Severity: {response.severity_assessment}</h4>
                    <p className="text-sm text-red-400 mt-1">{response.core_issue}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <ChevronRight className="size-4 text-primary" />
                  Official PR Statement
                </h4>
                <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-foreground whitespace-pre-wrap">
                  {response.pr_statement}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <ChevronRight className="size-4 text-primary" />
                  Suggested Tweet
                </h4>
                <div className="rounded-xl border border-[#1DA1F2]/20 bg-[#1DA1F2]/5 p-4 text-sm text-foreground">
                  {response.suggested_tweet}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <h4 className="font-semibold text-emerald-500 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="size-4" /> Do's
                  </h4>
                  <ul className="space-y-2 text-sm text-emerald-600/90 dark:text-emerald-400">
                    {response.dos.map((d, i) => <li key={i}>• {d}</li>)}
                  </ul>
                </div>
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <h4 className="font-semibold text-red-500 mb-3 flex items-center gap-2">
                    <XCircle className="size-4" /> Don'ts
                  </h4>
                  <ul className="space-y-2 text-sm text-red-600/90 dark:text-red-400">
                    {response.donts.map((d, i) => <li key={i}>• {d}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
