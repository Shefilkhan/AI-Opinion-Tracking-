import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ApiError } from "@/api/client"
import { createProject } from "@/api/projects"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import {
  ProjectForm,
  type ProjectFormValues,
} from "@/components/projects/ProjectForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function CreateProjectPage() {
  const navigate = useNavigate()
  const [values, setValues] = useState<ProjectFormValues>({
    name: "",
    description: "",
    tracking_frequency: "daily",
  })
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
    <DashboardLayout title="Create project" subtitle="Set up a new tracking workspace">
      <div className="mx-auto max-w-lg">
        <Card className="border-slate-800/60 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-white">Project details</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectForm
              values={values}
              onChange={setValues}
              onSubmit={handleSubmit}
              submitLabel="Create project"
              loading={loading}
              error={error}
            />
          </CardContent>
        </Card>
        <Button render={<Link to="/projects" />} variant="ghost" className="mt-4">
          Cancel
        </Button>
      </div>
    </DashboardLayout>
  )
}
