import { useQueries } from "@tanstack/react-query"
import { useEffect, useMemo } from "react"
import { Link, useLocation } from "react-router-dom"
import { ContextCard } from "@/features/context/ContextCard"
import { FilterBar } from "@/features/datasets/components/FilterBar"
import { pickFilters } from "@/features/datasets/search"
import { datasetNav } from "@/app/navigation"
import { ChartCard } from "@/components/common/ChartCard"
import { ErrorState } from "@/components/common/ErrorState"
import { ActionStrip } from "@/components/common/ActionStrip"
import { Headline } from "@/components/common/Headline"
import { KpiCard } from "@/components/common/KpiCard"
import { PageHeader } from "@/components/common/PageHeader"
import { UpdateLine } from "@/components/common/UpdateLine"
import { pageCopy } from "@/content/pages"
import { kpiView } from "@/lib/kpiView"
import { fetchData, fetchPyramid } from "@/features/datasets/api"
import { EnrichmentChart } from "@/features/datasets/components/EnrichmentChart"
import { ProjectionLine } from "@/features/datasets/components/ProjectionLine"
import { ObservationsCard } from "@/components/common/NarrativeText"
import { buildNarratives, finalObservations } from "@/lib/narratives/engine"
import { num, peakPoint } from "@/features/datasets/derive"
import { useContext, useDashboardFilters, useDatasetList, useFacts, useRows } from "@/features/datasets/hooks"
import { FactsCard } from "@/features/facts/FactsCard"
import { SimplePage } from "@/features/simple/SimplePage"
import { chartId, focusChart } from "@/lib/chartId"
import { formatValue } from "@/lib/format"
import { useMotionFilters, usePageReady } from "@/motion/usePageReady"
import { useMode } from "@/stores/preferences"
import { queryClient, STALE_TIME } from "@/lib/queryClient"

export function OverviewPage() {
  const mode = useMode()
  const filters = useDashboardFilters()
  const facts = useFacts("overview")
  const { search, hash } = useLocation()
  const year = filters.ano
  const cod = filters.cod
  const place = filters.territories.find((item) => item.cod === cod)?.local ?? "Brasil"
  const datasets = useDatasetList()
  const context = useContext("overview", { ano: year, cod, sexo: "Ambos" })
  const brazil = useRows("ds4", { cod: 0, pageSize: 200 }, cod !== 0)
  const rows = useQueries({
    queries: [
      {
        queryKey: ["dataset", "ds4", "rows", { cod, pageSize: 200 }],
        queryFn: () => fetchData("ds4", { cod, pageSize: 200 }),
        staleTime: STALE_TIME,
      },
    ],
  })
  useEffect(() => {
    if (!hash.startsWith("#chart-")) return
    focusChart(decodeURIComponent(hash.slice("#chart-".length)))
  }, [hash, context.data])
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
          territorio: { cod, nome: place, nivel: cod === 0 ? "brasil" : cod <= 5 ? "regiao" : "uf" },
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
    [cod, place, points, year],
  )

  useEffect(() => {
    void queryClient.prefetchQuery({
      queryKey: ["dataset", "ds1", "pyramid", 0, "Ambos"],
      queryFn: () => fetchPyramid("ds1", 0),
      staleTime: STALE_TIME,
    })
  }, [])

  const kpis = [
    { key: "pop_t", label: "População", format: "int" as const },
    { key: "e0_t", label: "Esperança de vida ao nascer", format: "years" as const },
    { key: "tft", label: "Filhos por mulher", format: "decimal" as const },
    { key: "ie60", label: "Idosos para cada 100 crianças", format: "decimal" as const },
  ]
  usePageReady(Boolean(rows[0]?.isSuccess || rows[0]?.isError))
  useMotionFilters(`${cod}|${year}`)
  const copy = pageCopy("overview")
  const processed = datasets.data?.map((item) => item.last_run?.finished_at).filter((item): item is string => Boolean(item)).sort().at(-1)
  const previous = series.find((row) => Number(row.ano) === year - 1)
  const base = series.find((row) => Number(row.ano) === 2000)
  const brazilNow = (brazil.data?.items ?? []).find((row) => Number(row.ano) === year)
  const views = kpis.map((kpi) => ({
    ...kpi,
    ...kpiView(kpi.key, {
      value: num(current?.[kpi.key]),
      prevYear: num(previous?.[kpi.key]),
      past10: num(past?.[kpi.key]),
      brazil: num(brazilNow?.[kpi.key]),
      year2000: num(base?.[kpi.key]),
      cod,
    }),
  }))

  if (mode === "simple") return <SimplePage pageId="overview" />

  return (
    <div className="page-stack">
      <PageHeader title="Visão geral" lead={copy?.question} audience={copy?.audience} meta={<UpdateLine processedAt={processed} latestRevision={datasets.data?.[0]?.latest_revision} />} />
      <FilterBar
        territories={filters.territories}
        filters={["territorio", "ano"]}
        cod={cod}
        ano={year}
        sexo="Ambos"
        onCod={filters.setCod}
        onAno={filters.setAno}
        onSexo={() => undefined}
      />
      <Headline pageId="overview" input={{ cod, place, ano: year, pop: num(current?.pop_t), peakYear: peak?.ano ?? null, e0: num(current?.e0_t), e0Brazil: num(brazilNow?.e0_t) }} />
      <section className="dashboard-grid" aria-label="Indicadores do Brasil">
        {views.map((kpi) => (
          <KpiCard
            key={kpi.key}
            metricKey={kpi.key}
            label={kpi.label}
            value={num(current?.[kpi.key])}
            format={kpi.format === "int" ? "integer" : kpi.format}
            delta={kpi.delta}
            status={kpi.status}
            reference={kpi.reference}
            loading={rows[0]?.isLoading}
          />
        ))}
      </section>
      <ActionStrip items={views.flatMap((item) => (item.status && item.status !== "good" ? [{ id: item.key, label: item.label, action: item.action, status: item.status }] : []))} />
      {rows[0]?.error instanceof Error ? (
        <ErrorState message={rows[0].error.message} onRetry={() => void rows[0]?.refetch()} />
      ) : null}
      <div className="chart-board">
        <div className="span-8">
          <ChartCard
            metricKey="pop_t"
            chartId={chartId("População, 2000–2070")}
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
              reference={cod === 0 ? undefined : (brazil.data?.items ?? []).map((row) => ({ ano: Number(row.ano), pop_t: num(row.pop_t) }))}
              referenceKey="pop_t"
              summary={peak ? `A população chega a ${formatValue(peak.valor, { key: "pop_t", kind: "count" })} em ${peak.ano}.` : `Série da população de ${place}.`}
            />
          </ChartCard>
        </div>
        <div className="span-4">
          <ContextCard
            items={context.data}
            loading={context.isLoading}
            error={context.error instanceof Error ? context.error.message : null}
            onRetry={() => void context.refetch()}
          />
        </div>
      </div>
      <ObservationsCard insights={insights} />
      <EnrichmentChart
        datasetId="ds4"
        cod={cod}
        year={year}
        sexo="Ambos"
        spec={{
          kind: "milestones",
          title: "Marcos da projeção",
          description: "Pico, cruzamento de idades, reposição e saldo natural.",
          span: 12,
        }}
      />
      <FactsCard facts={facts.data} factsCod={facts.factsCod} territoryCod={facts.territoryCod} loading={facts.isLoading} />
      <section className="dashboard-grid" aria-label="Datasets">
        {datasetNav.map((item) => {
          const id = item.to.split("/").pop() ?? ""
          const run = datasets.data?.find((entry) => entry.id === id)?.last_run
          return (
            <Link key={item.to} to={{ pathname: item.to, search: pickFilters(search) }} className="rounded-lg border border-border p-4 text-sm hover:bg-muted">
              <span className="block font-medium">{item.label}</span>
              <span className="mt-1 block text-muted-foreground">{item.title}</span>
              <span className="mt-2 block text-xs text-muted-foreground">
                {run ? `${run.source ?? "processado"} · ${formatValue(run.rows_out ?? 0, { key: "linhas", kind: "count" })} linhas` : "Sem processamento"}
              </span>
            </Link>
          )
        })}
      </section>
    </div>
  )
}

