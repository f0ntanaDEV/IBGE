import { useQueries } from "@tanstack/react-query"
import { useEffect, useMemo } from "react"
import { Link, useLocation } from "react-router-dom"
import { datasetNav } from "@/app/navigation"
import { ChartCard } from "@/components/common/ChartCard"
import { KpiCard } from "@/components/common/KpiCard"
import { PageHeader } from "@/components/common/PageHeader"
import { fetchData, fetchPyramid } from "@/features/datasets/api"
import { EnrichmentChart } from "@/features/datasets/components/EnrichmentChart"
import { ProjectionLine } from "@/features/datasets/components/ProjectionLine"
import { ObservationsCard } from "@/components/common/NarrativeText"
import { buildNarratives, finalObservations } from "@/lib/narratives/engine"
import { calendarYear, deltaValue, num, peakPoint } from "@/features/datasets/derive"
import { useDatasetList, useFacts } from "@/features/datasets/hooks"
import { FactsCard } from "@/features/facts/FactsCard"
import { SimplePage } from "@/features/simple/SimplePage"
import { formatValue } from "@/lib/format"
import { useMode } from "@/stores/preferences"
import { queryClient, STALE_TIME } from "@/lib/queryClient"

export function OverviewPage() {
  const mode = useMode()
  const facts = useFacts("overview")
  const { search } = useLocation()
  const year = calendarYear()
  const datasets = useDatasetList()
  const rows = useQueries({
    queries: [
      {
        queryKey: ["dataset", "ds4", "rows", { cod: 0, pageSize: 200 }],
        queryFn: () => fetchData("ds4", { cod: 0, pageSize: 200 }),
        staleTime: STALE_TIME,
      },
    ],
  })
  const series = rows[0]?.data?.items ?? []
  const current = series.find((row) => Number(row.ano) === year)
  const past = series.find((row) => Number(row.ano) === year - 10)
  const points = useMemo(
    () =>
      series
        .map((row) => ({ ano: Number(row.ano), pop_t: num(row.pop_t) }))
        .filter((row) => Number.isFinite(row.ano))
        .sort((a, b) => a.ano - b.ano),
    [series],
  )
  const peak = peakPoint(points.map((row) => ({ ano: row.ano, valor: row.pop_t })))
  const insights = useMemo(
    () =>
      finalObservations(
        buildNarratives({
          datasetId: "overview",
          territorio: { cod: 0, nome: "Brasil", nivel: "brasil" },
          ano: year,
          sexo: "Ambos",
          selection: {},
          series: [{ key: "pop_t", label: "População" }],
          data: {
            series: points.flatMap((row) => (row.pop_t == null ? [] : [{ ano: row.ano, valor: row.pop_t }])),
            projectionFrom: year,
          },
        }),
      ),
    [points, year],
  )

  useEffect(() => {
    void queryClient.prefetchQuery({
      queryKey: ["dataset", "ds1", "pyramid", 0, "Ambos"],
      queryFn: () => fetchPyramid("ds1", 0),
      staleTime: STALE_TIME,
    })
  }, [])

  const kpis = [
    { key: "pop_t", label: "População", format: "int" as const, hint: "População projetada do Brasil." },
    { key: "e0_t", label: "Esperança de vida", format: "years" as const, hint: "Anos esperados ao nascer." },
    { key: "tft", label: "Taxa de fecundidade", format: "decimal" as const, hint: "Número médio de filhos por mulher." },
    { key: "ie60", label: "Índice de envelhecimento", format: "decimal" as const, hint: "Idosos de 60 anos ou mais para cada 100 jovens." },
  ]

  if (mode === "simple") return <SimplePage pageId="overview" />

  return (
    <div className="page-stack">
      <PageHeader title="Visão geral" description={`Brasil, ${year}. Projeções da população, revisão 2024.`} />
      <section className="dashboard-grid" aria-label="Indicadores do Brasil">
        {kpis.map((kpi) => {
          const value = num(current?.[kpi.key])
          const previous = num(past?.[kpi.key])
          return (
            <KpiCard
              key={kpi.key}
              metricKey={kpi.key}
              label={kpi.label}
              value={value}
              format={kpi.format === "int" ? "integer" : kpi.format}
              delta={deltaValue(value, previous, kpi.format)}
              loading={rows[0]?.isLoading}
            />
          )
        })}
      </section>
      <ChartCard
        metricKey="pop_t"
        title="População, 2000–2070"
        description="A linha tracejada marca os anos projetados depois do ano atual."
        loading={rows[0]?.isLoading}
        error={rows[0]?.error instanceof Error ? rows[0].error.message : null}
        onRetry={() => void rows[0]?.refetch()}
      >
        <ProjectionLine
          data={points}
          series={[{ key: "pop_t", label: "População", format: "integer" }]}
          variant="line"
          markMax
          summary={peak ? `A população chega a ${formatValue(peak.valor, { key: "pop_t", kind: "count" })} em ${peak.ano}.` : "Série da população brasileira."}
        />
      </ChartCard>
      <FactsCard facts={facts.data} factsCod={facts.factsCod} territoryCod={facts.territoryCod} loading={facts.isLoading} />
      <ObservationsCard insights={insights} />
      <EnrichmentChart
        datasetId="ds4"
        cod={0}
        year={year}
        sexo="Ambos"
        spec={{
          kind: "milestones",
          title: "Marcos da projeção",
          description: "Pico, cruzamento de idades, reposição e saldo natural.",
          span: 12,
        }}
      />
      <section className="dashboard-grid" aria-label="Datasets">
        {datasetNav.map((item) => {
          const id = item.to.split("/").pop() ?? ""
          const run = datasets.data?.find((entry) => entry.id === id)?.last_run
          return (
            <Link key={item.to} to={{ pathname: item.to, search }} className="rounded-lg border border-border p-4 text-sm hover:bg-muted">
              <span className="block font-medium">{item.label}</span>
              <span className="mt-1 block text-muted-foreground">{item.title}</span>
              <span className="mt-2 block text-xs text-muted-foreground">
                {run ? `${run.source ?? "processado"} · ${formatValue(run.rows_out ?? 0, { key: "linhas", kind: "count" })} linhas` : "Sem processamento"}
              </span>
            </Link>
          )
        })}
      </section>
      <section data-card className="rounded-lg border border-border p-4" aria-label="Censo 2022">
        <h2 className="text-sm font-medium">Censo 2022</h2>
        <p className="mt-2 text-sm text-muted-foreground">A referência do Censo aparece nas páginas de população, grupos etários e indicadores.</p>
      </section>
    </div>
  )
}

