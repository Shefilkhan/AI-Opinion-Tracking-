import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

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
        <Badge variant="secondary" className="mb-4">
          {badge}
        </Badge>
      )}
      <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
        {description}
      </p>
    </div>
  )
}
