import { ScrollReveal } from "@/components/landing/ScrollReveal"
import { cn } from "@/lib/utils"

export function LiveDemoSection() {
  return (
    <section id="demo" className="relative overflow-hidden bg-background py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif-display text-3xl font-medium tracking-normal text-foreground md:text-4xl">
            See It In Action
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Real data, real sentiment, real insights
          </p>
        </ScrollReveal>

        <ScrollReveal className="relative mx-auto mt-16 max-w-5xl" delay={150}>
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <div className="flex gap-1.5">
                <div className="size-3 rounded-full bg-red-400" />
                <div className="size-3 rounded-full bg-yellow-400" />
                <div className="size-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 rounded-md bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
                opinionpulse.io/search?q=Bitcoin
              </div>
            </div>

            <div className="max-h-[480px] origin-top scale-[0.92] overflow-y-auto p-4 md:p-6">
              <div className="mb-4 flex gap-2">
                <div className="h-10 flex-1 rounded-lg border border-border bg-muted/30" />
                <div className="h-10 w-24 rounded-lg bg-primary" />
              </div>
              <div className="mb-4 flex flex-wrap gap-2">
                {["All", "Reddit", "YouTube", "News", "24h"].map((f) => (
                  <span
                    key={f}
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                  >
                    {f}
                  </span>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                  <div className="rounded-xl border border-border bg-muted/20 p-4">
                    <p className="text-xs text-muted-foreground">Wikipedia</p>
                    <p className="mt-1 text-sm font-medium text-foreground">Bitcoin</p>
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                      Decentralized digital currency without a central bank...
                    </p>
                  </div>

                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <p className="text-xs font-medium text-primary">🤖 AI Opinion Analysis</p>
                    <p className="mt-2 text-sm text-foreground">
                      &ldquo;Bitcoin faces a crisis of confidence as institutional support
                      clashes with retail fear.&rdquo;
                    </p>
                  </div>

                  {[
                    {
                      platform: "Reddit",
                      title: "BTC drops 7% — what now?",
                      swatch: "bg-orange-100",
                    },
                    {
                      platform: "YouTube",
                      title: "Why I'm still bullish on Bitcoin",
                      swatch: "bg-red-100",
                    },
                    {
                      platform: "News",
                      title: "Regulators eye crypto ETFs",
                      swatch: "bg-blue-100",
                    },
                  ].map((r) => (
                    <div
                      key={r.title}
                      className="flex gap-3 rounded-xl border border-border bg-muted/20 p-3"
                    >
                      <div className={cn("size-10 shrink-0 rounded-lg", r.swatch)} />
                      <div>
                        <span className="text-[10px] text-muted-foreground">{r.platform}</span>
                        <p className="text-sm font-medium text-foreground">{r.title}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-xs font-medium text-muted-foreground">Top Keywords</p>
                  <ul className="mt-3 space-y-2 text-sm text-foreground">
                    <li>#bitcoin</li>
                    <li>#crypto</li>
                    <li>#etf</li>
                    <li>#volatility</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
