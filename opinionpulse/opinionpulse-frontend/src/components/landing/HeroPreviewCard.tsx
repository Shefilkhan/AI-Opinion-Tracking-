import { heroPreviewStats } from "@/data/landingData"

export function HeroPreviewCard() {
  return (
    <div className="relative">
      <div className="absolute inset-0 scale-110 rounded-3xl bg-gradient-to-r from-purple-600/20 to-blue-600/20 blur-3xl" />

      <div className="absolute -right-4 -top-4 z-10 flex animate-bounce items-center gap-1.5 rounded-xl bg-green-500 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-green-500/30">
        <span className="size-1.5 rounded-full bg-white" />
        Live Data
      </div>

      <div className="absolute -bottom-5 -left-6 z-10 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs text-white backdrop-blur-md">
        <div className="font-semibold text-purple-300">🔥 Trending Now</div>
        <div className="mt-0.5 text-gray-400">#AI #Bitcoin #Climate</div>
      </div>

      <div className="relative rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
          <div className="flex gap-1.5">
            <div className="size-3 rounded-full bg-red-500/70" />
            <div className="size-3 rounded-full bg-yellow-500/70" />
            <div className="size-3 rounded-full bg-green-500/70" />
          </div>
          <div className="mx-3 flex-1 rounded-md bg-white/5 px-3 py-1 text-xs text-gray-500">
            opinionpulse.io/search?q=Artificial+Intelligence
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium text-white/80">
            Sentiment Overview — &ldquo;Artificial Intelligence&rdquo;
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
              <div className="text-lg font-bold text-white">12.4K</div>
              <div className="text-xs text-gray-500">Mentions</div>
            </div>
            <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-center">
              <div className="text-lg font-bold text-green-400">42%</div>
              <div className="text-xs text-gray-500">Positive</div>
            </div>
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center">
              <div className="text-lg font-bold text-red-400">31%</div>
              <div className="text-xs text-gray-500">Negative</div>
            </div>
          </div>

          <div className="space-y-2">
            {heroPreviewStats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                <span className="w-14 text-xs text-gray-400">{stat.label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full ${stat.color}`}
                    style={{ width: `${stat.value}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">{stat.value}%</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <span className="rounded-full border border-orange-500/30 bg-orange-500/20 px-2 py-0.5 text-xs text-orange-300">
              Reddit ✓
            </span>
            <span className="rounded-full border border-red-500/30 bg-red-500/20 px-2 py-0.5 text-xs text-red-300">
              YouTube ✓
            </span>
            <span className="rounded-full border border-blue-500/30 bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300">
              News ✓
            </span>
          </div>

          <div className="mt-3 rounded-lg border border-purple-500/20 bg-purple-500/10 p-3">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs font-medium text-purple-300">🤖 AI Analysis</span>
              <span className="text-xs text-gray-500">Powered by Claude</span>
            </div>
            <p className="text-xs leading-relaxed text-gray-300">
              &ldquo;Public optimism about AI is surging but fears about job displacement
              create a deeply divided conversation...&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
