import { useState } from "react"
import { ImageIcon } from "lucide-react"
import { platformBadge } from "@/lib/api/sentiment"
import { platformBrandColor } from "@/lib/platformBrandColors"
import { cn } from "@/lib/utils"

type DebateMediaProps = {
  platform: string
  thumbnail?: string | null
  title: string
  sourceLabel?: string | null
  className?: string
}

export function DebateMedia({
  platform,
  thumbnail,
  title,
  sourceLabel,
  className,
}: DebateMediaProps) {
  const [failed, setFailed] = useState(false)
  const badge = platformBadge(platform, sourceLabel)
  const brand = platformBrandColor(platform)
  const showImage = Boolean(thumbnail) && !failed

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[var(--dash-surface-alt)]",
        "h-[92px] w-[128px] sm:h-[96px] sm:w-[136px]",
        className
      )}
    >
      {showImage ? (
        <img
          src={thumbnail!}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-1.5 p-2"
          style={{
            background: `linear-gradient(145deg, ${brand}22 0%, ${brand}55 100%)`,
          }}
        >
          <span className="text-lg font-bold text-white drop-shadow-sm">
            {badge.icon}
          </span>
          <ImageIcon
            className="size-3.5 text-white/70"
            strokeWidth={2}
            aria-hidden
          />
        </div>
      )}
      <span
        className={cn(
          "absolute bottom-1.5 left-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold shadow-sm",
          badge.className
        )}
      >
        {badge.label}
      </span>
      <span className="sr-only">{title}</span>
    </div>
  )
}
