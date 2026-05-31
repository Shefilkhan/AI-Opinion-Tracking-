import { ExternalLink } from "lucide-react"
import type { SupportingMention } from "@/api/chat"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const SOURCE_STYLES: Record<string, string> = {
  manual: "bg-violet-500/15 text-violet-300",
  reddit: "bg-orange-500/15 text-orange-300",
  youtube: "bg-red-500/15 text-red-300",
  gdelt: "bg-blue-500/15 text-blue-300",
  hackernews: "bg-amber-500/15 text-amber-300",
}

const LABEL_STYLES: Record<string, string> = {
  positive: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  negative: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  neutral: "bg-slate-500/15 text-slate-300 border-slate-500/30",
}

type SupportingMentionsProps = {
  mentions: SupportingMention[]
}

export function SupportingMentions({ mentions }: SupportingMentionsProps) {
  if (!mentions.length) return null

  return (
    <div className="mt-3 space-y-2 border-t border-slate-800/80 pt-3">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
        Supporting mentions
      </p>
      <ul className="space-y-2">
        {mentions.map((m) => (
          <li
            key={m.id}
            className="rounded-lg border border-slate-800/60 bg-slate-950/50 p-3 text-sm"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge
                className={cn(
                  "capitalize",
                  SOURCE_STYLES[m.source] ?? "bg-slate-700 text-slate-300"
                )}
              >
                {m.source}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "capitalize border",
                  LABEL_STYLES[m.sentiment_label] ?? "border-slate-600 text-slate-400"
                )}
              >
                {m.sentiment_label}
              </Badge>
              <span className="text-xs text-slate-500">
                Score: {m.sentiment_score.toFixed(2)}
              </span>
            </div>
            <p className="line-clamp-3 text-slate-300">{m.text}</p>
            {m.url && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-8 gap-1 px-2 text-blue-400"
                render={
                  <a href={m.url} target="_blank" rel="noopener noreferrer" />
                }
              >
                <ExternalLink className="size-3.5" />
                Open source
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
