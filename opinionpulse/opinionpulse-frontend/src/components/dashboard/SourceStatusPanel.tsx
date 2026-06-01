import type { SettingsStatus } from "@/api/settings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cardSurface } from "@/lib/ui-classes"

function Row({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Badge
        className={
          ok ? "bg-success/5 text-success" : "bg-muted text-muted-foreground"
        }
      >
        {ok ? "OK" : "Missing"}
      </Badge>
    </div>
  )
}

export function SourceStatusPanel({ status }: { status?: SettingsStatus }) {
  return (
    <Card className={cardSurface}>
      <CardHeader>
        <CardTitle className="text-foreground">Source & API status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <Row label="Backend" ok={status?.backend_connected ?? true} />
        <Row label="GDELT" ok={status?.gdelt_available ?? true} />
        <Row label="YouTube" ok={status?.youtube_configured ?? false} />
        <Row label="Reddit" ok={status?.reddit_configured ?? false} />
        <Row label="Email OTP" ok={status?.email_configured ?? false} />
      </CardContent>
    </Card>
  )
}
