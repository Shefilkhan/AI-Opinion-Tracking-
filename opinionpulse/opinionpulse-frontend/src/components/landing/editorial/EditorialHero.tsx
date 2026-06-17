import { useState } from "react"
import {
  editorialImages,
  sourceFilters,
  type SourceFilterId,
} from "@/data/landingEditorialData"
import { cn } from "@/lib/utils"

export function EditorialHero() {
  const [activeFilter, setActiveFilter] = useState<SourceFilterId>("all")

  return (
    <section className="pb-8 pt-10 text-center md:pt-14">
      <div className="le-container">
        <h1 className="le-hero-title">Track every opinion.</h1>

        <div className="le-hero-stage">
          <div className="le-hero-sage-block" aria-hidden />
          <div className="le-laptop">
            <div className="le-laptop-screen">
              <img
                src={editorialImages.heroLandscape}
                alt="Rolling green hills representing broad public discourse"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="le-chart-overlay" aria-hidden>
                <div className="mb-1 text-[0.5625rem] font-semibold uppercase tracking-wide text-[var(--le-muted)]">
                  Sentiment pulse
                </div>
                <div className="flex items-end gap-1" style={{ height: "2.5rem" }}>
                  {[42, 58, 35, 72, 48, 65, 52].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-[var(--le-sage)]"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="mt-1 flex justify-between text-[0.5rem] text-[var(--le-muted)]">
                  <span>Positive 42%</span>
                  <span>13 sources</span>
                </div>
              </div>
            </div>
            <div className="le-laptop-base" aria-hidden />
          </div>
        </div>

        <div className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-2">
          {sourceFilters.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveFilter(id)}
              className={cn("le-pill", activeFilter === id && "le-pill-active")}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>

        <p className="le-body mx-auto mt-6 max-w-xl">
          Search Reddit, YouTube, Bluesky, Mastodon, GitHub, news outlets, and more — then
          let AI summarize what the world is saying.
        </p>
      </div>
    </section>
  )
}
