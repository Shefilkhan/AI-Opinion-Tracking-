import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { ApiError } from "@/api/client"
import { createProject } from "@/api/projects"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import {
  ProjectForm,
  type ProjectFormValues,
} from "@/components/projects/ProjectForm"
import { mutedText, sectionTitle } from "@/lib/ui-classes"
import { cn } from "@/lib/utils"

const cancelLinkClass = cn(
  "inline-flex min-h-11 w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground",
  "transition-colors duration-150",
  "hover:bg-gray-100 hover:text-black",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
  "sm:min-h-0 sm:w-auto"
)

export function CreateProjectPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const keyword = searchParams.get("keyword")
  const [values, setValues] = useState<ProjectFormValues>({
    name: keyword ? `${keyword} Tracking` : "",
    description: keyword ? `Track public opinion about ${keyword}.` : "",
    tracking_frequency: "daily",
  })

  useEffect(() => {
    if (keyword) {
      setValues((v) => ({
        ...v,
        name: `${keyword} Tracking`,
        description: `Track public opinion about ${keyword}.`,
      }))
    }
  }, [keyword])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const project = await createProject({
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        tracking_frequency: values.tracking_frequency,
      })
      navigate(`/projects/${project.id}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to create project")
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout
      title="Create project"
      subtitle="Set up a new tracking workspace"
    >
      <section className="mx-auto w-full max-w-lg space-y-4">
        <article className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className={sectionTitle}>Project details</h2>
          <p className={cn(mutedText, "mt-1")}>
            Name your workspace and choose how often to collect data.
          </p>
          <ProjectForm
            className="mt-6"
            values={values}
            onChange={setValues}
            onSubmit={handleSubmit}
            submitLabel="Create project"
            loading={loading}
            error={error}
          />
        </article>

        <Link to="/projects" className={cancelLinkClass}>
          Cancel
        </Link>
      </section>
    </DashboardLayout>
  )
}
