import type { ReactNode } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { btnPrimary, proCard, sectionDescription, sectionTitle } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type SettingsPanelProps = {
  title: string
  description?: string
  children: ReactNode
  onSave?: () => void
  saveLabel?: string
  saving?: boolean
  showSave?: boolean
  danger?: boolean
}

export function SettingsPanel({
  title,
  description,
  children,
  onSave,
  saveLabel = "Save changes",
  saving = false,
  showSave = true,
  danger = false,
}: SettingsPanelProps) {
  return (
    <div className={cn(proCard, "overflow-hidden", danger && "border-destructive/20")}>
      <div className="border-b border-border px-5 py-5 sm:px-6">
        <h2
          className={cn(
            sectionTitle,
            danger && "text-destructive"
          )}
        >
          {title}
        </h2>
        {description && (
          <p className={cn(sectionDescription, "mt-1")}>{description}</p>
        )}
      </div>
      <div className="space-y-6 px-5 py-6 sm:px-6">{children}</div>
      {showSave && onSave && (
        <div className="flex justify-end border-t border-border bg-muted/20 px-5 py-4 sm:px-6">
          <Button
            type="button"
            onClick={onSave}
            disabled={saving}
            className={cn("min-h-10 gap-2 px-5", btnPrimary)}
          >
            {saving && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {saving ? "Saving…" : saveLabel}
          </Button>
        </div>
      )}
    </div>
  )
}

export function FieldError({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <p className="mt-1.5 text-sm text-destructive" role="alert">
      {message}
    </p>
  )
}

export function FormField({
  label,
  htmlFor,
  children,
  error,
  hint,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
  error?: string | null
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      <FieldError message={error} />
    </div>
  )
}
