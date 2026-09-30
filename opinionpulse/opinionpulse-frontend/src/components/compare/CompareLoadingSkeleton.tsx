import { proCard } from "@/lib/ui-classes"

export function CompareLoadingSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className={`${proCard} h-24`} />
      <div className={`${proCard} h-48`} />
      <div className="grid gap-5 md:grid-cols-2">
        <div className={`${proCard} h-40`} />
        <div className={`${proCard} h-40`} />
      </div>
      <div className={`${proCard} h-64`} />
    </div>
  )
}
