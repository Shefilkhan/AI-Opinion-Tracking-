import { editorialImages, editorialSteps } from "@/data/landingEditorialData"

export function EditorialSteps() {
  return (
    <section id="steps" className="py-16 md:py-24">
      <div className="le-container">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="le-section-title">Three steps to clarity</h2>
          <p className="le-body max-w-xs text-sm">From raw posts to research-ready insight.</p>
        </div>

        <div className="grid gap-10 md:grid-cols-3 md:gap-8">
          {editorialSteps.map(({ step, title, description }) => (
            <div key={step}>
              <div className="le-step-num mb-3">{step}</div>
              <h3 className="mb-2 text-sm font-semibold text-[var(--le-text)]">{title}</h3>
              <p className="le-body text-[0.8125rem] leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 overflow-hidden rounded-2xl md:mt-16">
          <img
            src={editorialImages.coastal}
            alt="Aerial coastal landscape representing the breadth of public conversation"
            className="le-img aspect-[21/9] max-h-[420px] rounded-2xl object-cover"
          />
        </div>
      </div>
    </section>
  )
}
