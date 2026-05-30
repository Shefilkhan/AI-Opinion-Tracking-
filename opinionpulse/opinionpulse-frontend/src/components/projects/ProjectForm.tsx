import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { btnPrimary, inputSurface } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

export type ProjectFormValues = {
  name: string
  description: string
  tracking_frequency: "manual" | "daily" | "weekly"
}

type ProjectFormProps = {
  values: ProjectFormValues
  onChange: (values: ProjectFormValues) => void
  onSubmit: (e: React.FormEvent) => void
  submitLabel: string
  loading?: boolean
  error?: string | null
}

export function ProjectForm({
  values,
  onChange,
  onSubmit,
  submitLabel,
  loading,
  error,
}: ProjectFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm text-slate-400" htmlFor="name">
          Project name
        </label>
        <Input
          id="name"
          value={values.name}
          onChange={(e) => onChange({ ...values, name: e.target.value })}
          placeholder="Netflix pricing tracker"
          className={inputSurface}
          required
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm text-slate-400" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          value={values.description}
          onChange={(e) => onChange({ ...values, description: e.target.value })}
          placeholder="What are you tracking?"
          rows={3}
          className={cn(
            "w-full rounded-lg border px-3 py-2 text-sm text-white outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            inputSurface
          )}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm text-slate-400" htmlFor="frequency">
          Tracking frequency
        </label>
        <select
          id="frequency"
          value={values.tracking_frequency}
          onChange={(e) =>
            onChange({
              ...values,
              tracking_frequency: e.target.value as ProjectFormValues["tracking_frequency"],
            })
          }
          className={cn(
            "h-8 w-full rounded-lg border px-2.5 text-sm text-white",
            inputSurface
          )}
        >
          <option value="manual">Manual</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
      </div>
      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={loading}
        className={cn("w-full", btnPrimary)}
      >
        {loading ? "Saving…" : submitLabel}
      </Button>
    </form>
  )
}
