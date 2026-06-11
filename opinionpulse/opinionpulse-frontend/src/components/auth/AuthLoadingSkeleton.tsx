import { Skeleton } from "@/components/ui/Skeleton"
import { pageShell } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

/**
 * Shell shown while GET /api/auth/me is in flight (avoids login flash on refresh).
 */
export function AuthLoadingSkeleton() {
  return (
    <div
      className={cn("flex min-h-screen flex-col md:flex-row", pageShell)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading your account"
    >
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card md:flex lg:w-60">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <Skeleton className="size-8 shrink-0 rounded-md" />
          <Skeleton className="h-4 w-28" />
        </div>
        <nav className="space-y-1 p-3" aria-hidden>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </nav>
        <div className="mt-auto border-t border-border p-4">
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <Skeleton className="size-8 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-14 items-center justify-between gap-3 border-b border-border bg-card/80 px-4 py-2 sm:px-6 md:min-h-16 md:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Skeleton className="size-11 shrink-0 rounded-md md:hidden" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-6 w-40 sm:h-7 sm:w-48" />
              <Skeleton className="h-4 w-56 max-w-full" />
            </div>
          </div>
          <Skeleton className="h-11 w-24 shrink-0 rounded-lg sm:w-28" />
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 md:px-8">
          <div className="mx-auto w-full max-w-6xl space-y-6">
            <Skeleton className="h-24 w-full rounded-xl" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-48 w-full rounded-lg" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Skeleton className="h-40 rounded-lg" />
              <Skeleton className="h-40 rounded-lg" />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
