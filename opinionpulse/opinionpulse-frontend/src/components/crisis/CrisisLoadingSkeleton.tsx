import { proCard } from "@/lib/ui-classes"

export function CrisisLoadingSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className={`${proCard} h-28`} />
      <div className={`${proCard} h-24`} />
      <div className="grid gap-5 xl:grid-cols-12">
        <div className={`${proCard} h-[420px] xl:col-span-6`} />
        <div className={`${proCard} h-[420px] xl:col-span-6`} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className={`${proCard} h-64`} />
        <div className={`${proCard} h-64`} />
      </div>
      <div className={`${proCard} h-72`} />
    </div>
  )
}
