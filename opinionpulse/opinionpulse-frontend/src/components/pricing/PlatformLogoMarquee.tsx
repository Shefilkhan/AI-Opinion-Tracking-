import { platformLogos } from "@/data/platformLogos"
import { PlatformLogoIcon } from "@/components/pricing/PlatformLogoIcon"
import { cn } from "@/lib/utils"

type PlatformLogoMarqueeProps = {
  title?: string
  className?: string
  variant?: "light" | "dark"
}

function LogoRow({ variant }: { variant: "light" | "dark" }) {
  return (
    <>
      {platformLogos.map((platform) => (
        <div
          key={platform.id}
          className={cn(
            "le-platform-logo flex shrink-0 items-center gap-3 px-8",
            variant === "dark" ? "text-white/90" : "text-[var(--le-text)]"
          )}
        >
          <span
            className="flex size-9 items-center justify-center rounded-xl"
            style={{
              backgroundColor:
                variant === "dark"
                  ? `${platform.color}22`
                  : `color-mix(in srgb, ${platform.color} 18%, transparent)`,
              color: platform.color,
            }}
          >
            <PlatformLogoIcon id={platform.id} className="size-5" />
          </span>
          <span className="whitespace-nowrap text-base font-semibold tracking-tight">
            {platform.name}
          </span>
        </div>
      ))}
    </>
  )
}

export function PlatformLogoMarquee({
  title = "Powered by live data from leading platforms.",
  className,
  variant = "light",
}: PlatformLogoMarqueeProps) {
  return (
    <section className={cn("le-platform-marquee", className)} aria-label="Data source platforms">
      {title && (
        <p
          className={cn(
            "le-platform-marquee-title",
            variant === "dark" ? "text-white" : "text-[var(--le-text)]"
          )}
        >
          {title}
        </p>
      )}
      <div className="le-platform-marquee-viewport">
        <div className="le-platform-marquee-track">
          <LogoRow variant={variant} />
          <LogoRow variant={variant} aria-hidden />
        </div>
      </div>
    </section>
  )
}
