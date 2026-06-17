import { editorialImages, editorialQuote } from "@/data/landingEditorialData"

export function EditorialQuote() {
  return (
    <section className="py-16 md:py-20">
      <div className="le-container grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="aspect-square max-h-[420px] overflow-hidden rounded-2xl bg-[var(--le-beige)]">
          <img
            src={editorialImages.stones}
            alt="Balanced stones representing equilibrium in divided opinions"
            className="le-img h-full rounded-2xl"
          />
        </div>
        <blockquote>
          <p className="le-quote-text">&ldquo;{editorialQuote.text}&rdquo;</p>
          <footer className="le-body mt-6 text-sm">{editorialQuote.attribution}</footer>
        </blockquote>
      </div>
    </section>
  )
}
