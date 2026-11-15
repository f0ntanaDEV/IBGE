import { datasetById } from "@/app/navigation"
import { SimplePage } from "@/features/simple/SimplePage"
import { useMode } from "@/stores/preferences"
import { DatasetDashboardPage } from "@/features/datasets/DatasetDashboardPage"
import { dashboardById } from "@/features/datasets/dashboards.config"
import { ErrorPage } from "@/features/error/page"
import { useParams } from "react-router-dom"

export function DatasetPage() {
  const mode = useMode()
  const { id } = useParams()
  const dataset = datasetById(id)
  const spec = dashboardById(id)
  if (!dataset || !spec) {
    return (
      <ErrorPage
        code="404"
        title="Dataset não encontrado"
        message="Esse identificador não está no catálogo. Escolha uma base no menu ou volte para a visão geral."
      />
    )
  }
  if (mode === "simple") return <SimplePage pageId={spec.id} />
  return <DatasetDashboardPage spec={spec} />
}
