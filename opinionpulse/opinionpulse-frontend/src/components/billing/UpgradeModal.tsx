import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { proCard } from "@/lib/ui-classes"

type UpgradeModalProps = {
  isOpen: boolean
  onClose: () => void
  message: string
  upgradeTo: string
}

export function UpgradeModal({
  isOpen,
  onClose,
  message,
  upgradeTo,
}: UpgradeModalProps) {
  if (!isOpen) return null

  const planLabel = upgradeTo === "enterprise" ? "Enterprise" : "Pro"

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <div className={cn(proCard, "w-full max-w-md p-8 text-center shadow-xl")}>
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-2xl">
          🔒
        </div>

        <h3
          id="upgrade-modal-title"
          className="text-xl font-bold text-foreground"
        >
          Upgrade to unlock this
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {message}
        </p>

        <div className="mt-6 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border bg-card px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            Maybe later
          </button>
          <Link
            to="/pricing"
            onClick={onClose}
            className="flex flex-1 items-center justify-center rounded-xl bg-primary px-3 py-3 text-sm font-semibold text-primary-foreground no-underline transition-opacity hover:opacity-90"
          >
            View {planLabel} →
          </Link>
        </div>
      </div>
    </div>
  )
}
