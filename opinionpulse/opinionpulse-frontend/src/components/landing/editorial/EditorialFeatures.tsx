import { editorialFeatures, editorialImages } from "@/data/landingEditorialData"

export function EditorialFeatures() {
  return (
    <section id="features" className="py-16 md:py-24">
      <div className="le-container">
        <h2 className="le-section-title mb-10 max-w-lg">
          We&apos;ve cracked the code on public opinion.
        </h2>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {editorialFeatures.map(({ title, description, icon: Icon }) => (
            <div key={title}>
              <div className="le-feature-icon mb-4">
                <Icon className="size-5 stroke-[1.5]" />
              </div>
              <h3 className="mb-2 text-sm font-semibold text-[var(--le-text)]">{title}</h3>
              <p className="le-body text-[0.8125rem] leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 overflow-hidden rounded-2xl md:mt-16">
          <img
            src={editorialImages.canyon}
            alt="Colorful mountain landscape symbolizing diverse global perspectives"
            className="le-img aspect-[21/9] max-h-[420px] rounded-2xl object-cover"
          />
        </div>
      </div>
    </section>
  )
}
