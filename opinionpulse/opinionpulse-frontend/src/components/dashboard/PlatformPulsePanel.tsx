import type { PlatformPulse } from "@/api/dashboard"
import { StatusPill } from "@/components/layout/StatusPill"
import { proCard, sectionTitle } from "@/lib/ui-classes"

import { cn } from "@/lib/utils"

const platformColors: Record<string, string> = {
  reddit: "bg-orange-600",
  devto: "bg-violet-600",
  hackernews: "bg-orange-700",
  youtube: "bg-red-600",
  news: "bg-blue-600",
}

type PlatformPulsePanelProps = {
  items: PlatformPulse[]
}

export function PlatformPulsePanel({ items }: PlatformPulsePanelProps) {
  return (
    <section className={cn(proCard, "p-5")}>
      <h2 className={cn(sectionTitle, "mb-4")}>Social Media Pulse</h2>
      <ul className="space-y-5">
        {items.map((p) => (
          <li key={p.platform}>
            <div className="flex items-center gap-3">
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white ${platformColors[p.platform] ?? "bg-primary"}`}
              >
                {p.label.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{p.label}</p>
                  {p.live !== undefined && (
                    <StatusPill
                      label={p.live ? "Live" : "Demo"}
                      live={p.live}
                      variant={p.live ? "live" : "off"}
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{p.mentions}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Sentiment:</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-success"
                  style={{ width: `${p.positive_pct}%` }}
                />
              </div>
              <span className="text-xs font-medium text-success">
                {p.positive_pct}% positive
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
