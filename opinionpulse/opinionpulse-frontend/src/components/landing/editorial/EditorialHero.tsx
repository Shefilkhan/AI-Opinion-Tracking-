import { HeroCategoryShowcase } from "@/components/landing/HeroCategoryShowcase"

export function EditorialHero() {
  return (
    <section className="pb-8 pt-10 text-center md:pt-14">
      <div className="le-container">
        <h1 className="le-hero-title">Track every opinion.</h1>
        <HeroCategoryShowcase />
      </div>
    </section>
  )
}
