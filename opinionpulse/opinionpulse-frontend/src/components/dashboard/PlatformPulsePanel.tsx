import type { PlatformPulse } from "@/api/dashboard"

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
    <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-[#2d2d44] dark:bg-[#1e1e30]">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Social Media Pulse</h2>
      <ul className="space-y-5">
        {items.map((p) => (
          <li key={p.platform}>
            <div className="flex items-center gap-3">
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${platformColors[p.platform] ?? "bg-primary"}`}
              >
                {p.label.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {p.label}
                  {p.live !== undefined && (
                    <span
                      className={
                        p.live
                          ? "ml-2 text-[10px] font-normal text-green-600"
                          : "ml-2 text-[10px] font-normal text-gray-400"
                      }
                    >
                      {p.live ? "● Live" : "● Demo"}
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{p.mentions}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Sentiment:</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{ width: `${p.positive_pct}%` }}
                />
              </div>
              <span className="text-xs font-medium text-green-700">
                {p.positive_pct}% positive
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
