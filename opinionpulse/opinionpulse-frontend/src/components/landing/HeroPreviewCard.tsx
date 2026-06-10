import { heroPreviewStats } from "@/data/landingData"

export function HeroPreviewCard() {
  return (
    <div className="relative">
      <div className="absolute -right-4 -top-4 z-10 flex animate-bounce items-center gap-1.5 rounded-xl border border-success/20 bg-success/10 px-3 py-2 text-xs font-semibold text-success">
        <span className="size-1.5 rounded-full bg-success" />
        Live Data
      </div>

      <div className="absolute -bottom-5 -left-6 z-10 rounded-xl border border-border bg-card px-3 py-2 text-xs">
        <div className="font-semibold text-primary">🔥 Trending Now</div>
        <div className="mt-0.5 text-muted-foreground">#AI #Bitcoin #Climate</div>
      </div>

      <div className="relative rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
          <div className="flex gap-1.5">
            <div className="size-3 rounded-full bg-red-400" />
            <div className="size-3 rounded-full bg-yellow-400" />
            <div className="size-3 rounded-full bg-green-400" />
          </div>
          <div className="mx-3 flex-1 rounded-md bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
            opinionpulse.io/search?q=Artificial+Intelligence
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium text-foreground">
            Sentiment Overview — &ldquo;Artificial Intelligence&rdquo;
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-border bg-muted/20 p-3 text-center">
              <div className="text-lg font-bold text-foreground">12.4K</div>
              <div className="text-xs text-muted-foreground">Mentions</div>
            </div>
            <div className="rounded-lg border border-success/20 bg-success/5 p-3 text-center">
              <div className="text-lg font-bold text-success">42%</div>
              <div className="text-xs text-muted-foreground">Positive</div>
            </div>
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-center">
              <div className="text-lg font-bold text-destructive">31%</div>
              <div className="text-xs text-muted-foreground">Negative</div>
            </div>
          </div>

          <div className="space-y-2">
            {heroPreviewStats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                <span className="w-14 text-xs text-muted-foreground">{stat.label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${stat.color}`}
                    style={{ width: `${stat.value}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{stat.value}%</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs text-orange-700">
              Reddit ✓
            </span>
            <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs text-red-700">
              YouTube ✓
            </span>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
              News ✓
            </span>
          </div>

          <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs font-medium text-primary">🤖 AI Analysis</span>
              <span className="text-xs text-muted-foreground">Powered by Claude</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              &ldquo;Public optimism about AI is surging but fears about job displacement
              create a deeply divided conversation...&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
