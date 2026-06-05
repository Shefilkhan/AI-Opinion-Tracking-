import { ScrollReveal } from "@/components/landing/ScrollReveal"
import { cn } from "@/lib/utils"

export function LiveDemoSection() {
  return (
    <section
      id="demo"
      className="relative overflow-hidden py-20"
      style={{
        background: "linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 50%, #0d1117 100%)",
      }}
    >
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            See It In Action
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            Real data, real sentiment, real insights
          </p>
        </ScrollReveal>

        <ScrollReveal className="relative mx-auto mt-16 max-w-5xl" delay={150}>
          <div className="landing-glow-ring pointer-events-none absolute inset-0 -m-[5%]" aria-hidden />
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d1117] shadow-2xl">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="size-3 rounded-full bg-red-500/80" />
                <div className="size-3 rounded-full bg-yellow-500/80" />
                <div className="size-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 rounded-md bg-white/5 px-3 py-1 text-xs text-gray-500">
                opinionpulse.io/search?q=Bitcoin
              </div>
            </div>

            <div className="max-h-[480px] origin-top scale-[0.92] overflow-y-auto p-4 md:p-6">
              <div className="mb-4 flex gap-2">
                <div className="h-10 flex-1 rounded-lg border border-white/10 bg-white/5" />
                <div className="h-10 w-24 rounded-lg bg-purple-600/80" />
              </div>
              <div className="mb-4 flex flex-wrap gap-2">
                {["All", "Reddit", "YouTube", "News", "24h"].map((f) => (
                  <span
                    key={f}
                    className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-400"
                  >
                    {f}
                  </span>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-gray-500">Wikipedia</p>
                    <p className="mt-1 text-sm font-medium text-white">Bitcoin</p>
                    <p className="mt-2 line-clamp-2 text-xs text-gray-400">
                      Decentralized digital currency without a central bank...
                    </p>
                  </div>

                  <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
                    <p className="text-xs font-medium text-purple-300">🤖 AI Opinion Analysis</p>
                    <p className="mt-2 text-sm text-gray-300">
                      &ldquo;Bitcoin faces a crisis of confidence as institutional support
                      clashes with retail fear.&rdquo;
                    </p>
                  </div>

                  {[
                    {
                      platform: "Reddit",
                      title: "BTC drops 7% — what now?",
                      swatch: "bg-orange-500/20",
                    },
                    {
                      platform: "YouTube",
                      title: "Why I'm still bullish on Bitcoin",
                      swatch: "bg-red-500/20",
                    },
                    {
                      platform: "News",
                      title: "Regulators eye crypto ETFs",
                      swatch: "bg-blue-500/20",
                    },
                  ].map((r) => (
                    <div
                      key={r.title}
                      className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                    >
                      <div className={cn("size-10 shrink-0 rounded-lg", r.swatch)} />
                      <div>
                        <span className="text-[10px] text-gray-500">{r.platform}</span>
                        <p className="text-sm font-medium text-white">{r.title}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-medium text-gray-400">Top Keywords</p>
                  <ul className="mt-3 space-y-2 text-sm text-gray-300">
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
