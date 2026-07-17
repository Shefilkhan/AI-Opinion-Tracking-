import { Link, useSearchParams } from "react-router-dom"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { proCard } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

export function BillingCancelPage() {
  const [searchParams] = useSearchParams()
  const plan = searchParams.get("plan") ?? "pro"

  return (
    <DashboardLayout title="Checkout canceled" hidePageHeader>
      <div className={cn(proCard, "mx-auto max-w-lg p-8 text-center")}>
        <h2 className="text-xl font-semibold text-foreground">Checkout canceled</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No payment was made. You can try again whenever you&apos;re ready.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to={`/pricing/${plan}`}
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground no-underline"
          >
            Back to plans
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-5 text-sm font-medium text-foreground no-underline"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}
