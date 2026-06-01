type DevOtpBannerProps = {
  code: string
  hint?: string
}

export function DevOtpBanner({ code, hint }: DevOtpBannerProps) {
  return (
    <div
      className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm"
      role="status"
    >
      <p className="font-medium text-foreground">Development mode — email not configured</p>
      <p className="mt-1 text-muted-foreground">
        {hint ?? "Use this code to continue (also printed in the backend terminal):"}
      </p>
      <p className="mt-2 font-mono text-2xl font-semibold tracking-[0.3em] text-primary">
        {code}
      </p>
    </div>
  )
}
