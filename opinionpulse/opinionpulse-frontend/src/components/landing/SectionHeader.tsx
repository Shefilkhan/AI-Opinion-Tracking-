import { cn } from "@/lib/utils"

type SectionHeaderProps = {
  badge?: string
  title: string
  description: string
  className?: string
  align?: "left" | "center"
}

export function SectionHeader({
  badge,
  title,
  description,
  className,
  align = "center",
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-12 max-w-2xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {badge && (
        <span className="mb-4 inline-block rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-300">
          {badge}
        </span>
      )}
      <h2 className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-slate-400 md:text-lg">
        {description}
      </p>
    </div>
  )
}
