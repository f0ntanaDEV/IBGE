import { datasetById } from "@/app/navigation"
import { SimplePage } from "@/features/simple/SimplePage"
import { useMode } from "@/stores/preferences"
import { DatasetDashboardPage } from "@/features/datasets/DatasetDashboardPage"
import { dashboardById } from "@/features/datasets/dashboards.config"
import { ErrorState } from "@/components/common/ErrorState"
import { Link, useParams } from "react-router-dom"

export function DatasetPage() {
  const mode = useMode()
  const { id } = useParams()
  const dataset = datasetById(id)
  const spec = dashboardById(id)
  if (!dataset || !spec) {
    return (
      <ErrorState
        title="Dataset não encontrado"
        message="Esse identificador não está no catálogo."
        action={
          <Link to="/" className="text-sm underline">
            Voltar à visão geral
          </Link>
        }
      />
    )
  }
  if (mode === "simple") return <SimplePage pageId={spec.id} />
  return <DatasetDashboardPage spec={spec} />
}
