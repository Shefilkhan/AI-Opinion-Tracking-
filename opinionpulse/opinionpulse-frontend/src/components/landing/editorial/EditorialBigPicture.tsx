import { Link } from "react-router-dom"
import { editorialImages } from "@/data/landingEditorialData"

export function EditorialBigPicture() {
  return (
    <section className="py-16 md:py-20">
      <div className="le-container grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 className="le-section-title mb-4">See the big picture</h2>
          <p className="le-body mb-6 max-w-md">
            The live dashboard surfaces trending debates, platform-by-platform sentiment,
            and the topics driving conversation right now — all in one calm, official view.
          </p>
          <Link to="/dashboard" className="le-btn-sage">
            Open dashboard
          </Link>
        </div>
        <div className="aspect-square max-h-[480px] overflow-hidden rounded-2xl bg-[var(--le-beige)]">
          <img
            src={editorialImages.cylinders}
            alt="Minimal abstract visualization of structured data"
            className="le-img h-full rounded-2xl"
          />
        </div>
      </div>
    </section>
  )
}
