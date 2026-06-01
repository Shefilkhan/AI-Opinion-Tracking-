import type { ReactNode } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { btnPrimary } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

type SettingsPanelProps = {
  title: string
  description?: string
  children: ReactNode
  onSave?: () => void
  saveLabel?: string
  saving?: boolean
  showSave?: boolean
}

export function SettingsPanel({
  title,
  description,
  children,
  onSave,
  saveLabel = "Save changes",
  saving = false,
  showSave = true,
}: SettingsPanelProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="mb-6 border-b border-gray-200 pb-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-6">{children}</div>
      {showSave && onSave && (
        <div className="mt-8 flex justify-end border-t border-gray-200 pt-6">
          <Button
            type="button"
            onClick={onSave}
            disabled={saving}
            className={cn("min-h-11 gap-2 px-5 py-2.5", btnPrimary)}
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
    <p className="mt-1 text-sm text-destructive" role="alert">
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
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      )}
      <FieldError message={error} />
    </div>
  )
}
