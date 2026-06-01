import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { btnPrimary, errorSurface, labelText } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

export type ProjectFormValues = {
  name: string
  description: string
  tracking_frequency: "manual" | "daily" | "weekly"
}

const fieldClass = cn(
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-foreground",
  "transition-colors duration-150",
  "placeholder:text-muted-foreground",
  "hover:bg-gray-50",
  "focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
)

type ProjectFormProps = {
  values: ProjectFormValues
  onChange: (values: ProjectFormValues) => void
  onSubmit: (e: React.FormEvent) => void
  submitLabel: string
  loading?: boolean
  error?: string | null
  className?: string
}

export function ProjectForm({
  values,
  onChange,
  onSubmit,
  submitLabel,
  loading,
  error,
  className,
}: ProjectFormProps) {
  return (
    <form onSubmit={onSubmit} className={cn("space-y-4", className)}>
      <label className={cn("block", labelText)} htmlFor="name">
        Project name
        <Input
          id="name"
          value={values.name}
          onChange={(e) => onChange({ ...values, name: e.target.value })}
          placeholder="Netflix pricing tracker"
          className={cn(fieldClass, "mt-1.5 h-auto min-h-11")}
          required
        />
      </label>

      <label className={cn("block", labelText)} htmlFor="description">
        Description
        <textarea
          id="description"
          value={values.description}
          onChange={(e) => onChange({ ...values, description: e.target.value })}
          placeholder="What are you tracking?"
          rows={3}
          className={cn(fieldClass, "mt-1.5 resize-y")}
        />
      </label>

      <label className={cn("block", labelText)} htmlFor="frequency">
        Tracking frequency
        <select
          id="frequency"
          value={values.tracking_frequency}
          onChange={(e) =>
            onChange({
              ...values,
              tracking_frequency: e.target.value as ProjectFormValues["tracking_frequency"],
            })
          }
          className={cn(fieldClass, "mt-1.5 min-h-11 cursor-pointer")}
        >
          <option value="manual">Manual</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
      </label>

      {error && <p className={errorSurface}>{error}</p>}

      <Button
        type="submit"
        disabled={loading}
        className={cn(
          "min-h-11 w-full px-5 py-2.5 text-sm font-medium",
          "transition-colors duration-150",
          "focus-visible:ring-2 focus-visible:ring-blue-500",
          btnPrimary
        )}
      >
        {loading ? "Saving…" : submitLabel}
      </Button>
    </form>
  )
}
