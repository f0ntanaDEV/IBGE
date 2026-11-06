import { useQueries } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { datasetNav } from "@/app/navigation"
import { EmptyState } from "@/components/common/EmptyState"
import { NewsCard } from "@/components/common/NewsCard"
import { PageHeader } from "@/components/common/PageHeader"
import { Button } from "@/components/ui/button"
import { fetchDatasetNews } from "@/features/datasets/api"
import { dashboards } from "@/features/datasets/dashboards.config"
import { STALE_TIME } from "@/lib/queryClient"

const PAGE = 9

export function NewsPage() {
  const [datasetId, setDatasetId] = useState("todos")
  const [page, setPage] = useState(1)
  const queries = useQueries({
    queries: dashboards.map((spec) => ({
      queryKey: ["dataset", spec.id, "news"],
      queryFn: () => fetchDatasetNews(spec.id),
      staleTime: STALE_TIME,
    })),
  })
  const cached = queries.some((query) => query.data?.available === false)
  const items = useMemo(() => {
    return dashboards.flatMap((spec, index) => {
      if (datasetId !== "todos" && spec.id !== datasetId) return []
      return (queries[index]?.data?.items ?? []).map((item) => ({ ...item, datasetId: spec.id }))
    })
  }, [datasetId, queries])
  const pages = Math.max(1, Math.ceil(items.length / PAGE))
  const visible = items.slice((page - 1) * PAGE, page * PAGE)

  return (
    <div className="page-stack">
      <PageHeader title="Notícias IBGE" description="Matérias da Agência IBGE ligadas aos temas de cada projeção." />
      {cached ? <p className="text-sm text-muted-foreground">Fonte de notícias indisponível. Exibindo o conteúdo em cache.</p> : null}
      <div className="flex flex-wrap gap-3">
        <label className="grid gap-1 text-sm">
          Dataset
          <select
            className="h-9 rounded-md border border-border bg-background px-2"
            value={datasetId}
            onChange={(event) => {
              setDatasetId(event.target.value)
              setPage(1)
            }}
          >
            <option value="todos">Todos</option>
            {datasetNav.map((item) => (
              <option key={item.to} value={item.to.split("/").pop()}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {queries.every((query) => query.isLoading) ? <p className="text-sm text-muted-foreground">Carregando notícias…</p> : null}
      {visible.length === 0 && queries.some((query) => query.isSuccess) ? (
        <EmptyState title="Nenhuma notícia" description="Tente outro dataset." />
      ) : null}
      <div className="grid gap-3 md:grid-cols-3">
        {visible.map((item) => (
          <NewsCard
            key={`${item.datasetId}-${item.id ?? item.link}`}
            title={item.titulo ?? "Notícia IBGE"}
            summary={item.introducao ?? ""}
            date={item.data_publicacao ?? ""}
            url={item.link ?? "https://agenciadenoticias.ibge.gov.br/"}
            image={item.imagem ?? undefined}
            relatedMetric={datasetNav.find((nav) => nav.to.endsWith(item.datasetId))?.label}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm">
        <Button variant="outline" size="sm" onClick={() => setPage((current) => current - 1)} disabled={page <= 1}>
          Página anterior
        </Button>
        <span>
          {page} de {pages}
        </span>
        <Button variant="outline" size="sm" onClick={() => setPage((current) => current + 1)} disabled={page >= pages}>
          Próxima página
        </Button>
      </div>
    </div>
  )
}
