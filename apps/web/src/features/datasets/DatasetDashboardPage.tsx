import { useMemo, useState } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { datasetById } from "@/app/navigation"
import { ChartCard } from "@/components/common/ChartCard"
import { ErrorState } from "@/components/common/ErrorState"
import { FactsCard } from "@/features/facts/FactsCard"
import { DataTable } from "@/components/common/DataTable"
import { ObservationsCard } from "@/components/common/NarrativeText"
import { KpiCard } from "@/components/common/KpiCard"
import { NewsCard } from "@/components/common/NewsCard"
import { PageHeader } from "@/components/common/PageHeader"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  downloadHref,
  fetchData,
  processDataset,
  type NewsItem,
  type PyramidRow,
} from "@/features/datasets/api"
import { FilterBar } from "@/features/datasets/components/FilterBar"
import { FilterChipsBar } from "@/features/datasets/components/FilterChipsBar"
import { LifeTableChart, type LifePoint } from "@/features/datasets/components/LifeTableChart"
import { PopulationPyramid } from "@/features/datasets/components/PopulationPyramid"
import { ProjectionLine, type LinePoint } from "@/features/datasets/components/ProjectionLine"
import { RankingBars, type RankRow } from "@/features/datasets/components/RankingBars"
import { UploadDialog } from "@/features/datasets/components/UploadDialog"
import { packRows } from "@/features/datasets/board"
import { EnrichmentChart, isEnrichment } from "@/features/datasets/components/EnrichmentChart"
import { SERIES_LABELS, type ChartSpec, type DashboardSpec, type MetricFormat } from "@/features/datasets/dashboards.config"
import {
  ageKpis,
  broadBands,
  compositionSeries,
  calendarYear,
  crossingYear,
  deltaValue,
  groupKpis,
  isOutlier,
  num,
  peakPoint,
  populationSeries,
  rowsForYear,
  sexKind,
} from "@/features/datasets/derive"
import { buildNarratives, finalObservations } from "@/lib/narratives/engine"
import { useEffectiveFilters } from "@/stores/crossfilter"
import type { NarrativeContext } from "@/lib/narratives/types"
import {
  useCenso,
  useFacts,
  useClaims,
  useDashboardFilters,
  useDatasetList,
  useDatasetNews,
  useMetrics,
  usePyramid,
  useRows,
  useTerritories,
} from "@/features/datasets/hooks"
import { formatBy, formatValue, type NumberFormat } from "@/lib/format"
import { queryClient } from "@/lib/queryClient"

const COLUMN_LABELS: Record<string, string> = {
  ano: "Ano",
  idade: "Idade",
  sexo: "Sexo",
  local: "Local",
  sigla: "Sigla",
  populacao: "População",
  grupo_etario: "Grupo etário",
  is_outlier: "Atípica",
  pop_t: "População",
  n_0_14_t: "0–14",
  n_60_mais_t: "60+",
  p_60_mais_t: "% 60+",
  e0_t: "e0",
  tft: "TFT",
  tmi_t: "TMI",
  ie60: "IE60",
  nqx: "nqx",
  lx: "lx",
  ex: "ex",
}

function asFormat(format: MetricFormat): NumberFormat {
  if (format === "int") return "integer"
  return format
}

function cellText(value: unknown, key?: string) {
  if (value == null || value === "") return "—"
  if (typeof value === "boolean") return value ? "Sim" : "Não"
  if (typeof value === "number" && (key === "ano" || key === "year" || key?.startsWith("ano_"))) {
    return formatValue(value, { key: key ?? "ano", kind: "year" })
  }
  if (typeof value === "number") return Number.isInteger(value) ? formatBy("integer", value) : formatBy("decimal", value)
  return String(value)
}

function linePoints(items: Record<string, unknown>[], keys: string[]): LinePoint[] {
  return items
    .map((row) => {
      const point: LinePoint = { ano: Number(row.ano) }
      for (const key of keys) point[key] = num(row[key])
      return point
    })
    .filter((point) => Number.isFinite(point.ano))
    .sort((a, b) => a.ano - b.ano)
}

function lifePoints(items: Record<string, unknown>[], metric: string, sexes: ("h" | "m" | "t")[]): LifePoint[] {
  const byAge = new Map<number, LifePoint>()
  for (const row of items) {
    const age = Number(row.idade)
    const kind = sexKind(String(row.sexo ?? ""))
    if (!Number.isFinite(age) || !sexes.includes(kind)) continue
    const point: LifePoint = byAge.get(age) ?? { idade: age }
    const key = kind === "h" ? "homens" : kind === "m" ? "mulheres" : "ambos"
    point[key] = num(row[metric])
    byAge.set(age, point)
  }
  return [...byAge.values()].sort((a, b) => a.idade - b.idade)
}

function valueAtAge(items: Record<string, unknown>[], sexo: string, age: number, metric: string) {
  const kind = sexKind(sexo)
  const row = items.find((item) => Number(item.idade) === age && sexKind(String(item.sexo ?? "")) === kind)
  return num(row?.[metric])
}

export function DatasetDashboardPage({ spec }: { spec: DashboardSpec }) {
  const filters = useDashboardFilters()
  const sexo = filters.sexo
  const effective = useEffectiveFilters({ ano: filters.ano, cod: filters.cod, sexo })
  const activeKpis = spec.kpis
  const activeCharts = spec.charts
  const meta = datasetById(spec.id)
  const territories = useTerritories()
  const catalog = useDatasetList()
  const metrics = useMetrics(spec.id)
  const claims = useClaims(spec.id, spec.id === "ds1" || spec.id === "ds3" || spec.id === "ds4")
  const news = useDatasetNews(spec.id)
  const censo = useCenso(effective.cod, spec.showCensoReference)
  const facts = useFacts(spec.id)
  const pyramidEnabled = spec.id === "ds1" || spec.id === "ds2"
  const pyramid = usePyramid(spec.id, effective.cod, effective.sexo, pyramidEnabled)
  const series = useRows(spec.id, { cod: effective.cod, pageSize: 200 }, spec.id === "ds3" || spec.id === "ds4")
  const ranking = useRows(spec.id, { ano: effective.ano, nivel: "uf", pageSize: 50 }, spec.id === "ds3" || spec.id === "ds4")
  const life = useRows(
    spec.id,
    { ano: effective.ano, cod: effective.cod, pageSize: 200 },
    spec.id === "ds5",
  )
  const [compareYear, setCompareYear] = useState(2000)
  const [uploadOpen, setUploadOpen] = useState(false)
  const info = catalog.data?.find((item) => item.id === spec.id)
  const yearRows = useMemo(() => rowsForYear(pyramid.data ?? [], effective.ano), [effective.ano, pyramid.data])
  const priorPyramid = useMemo(() => rowsForYear(pyramid.data ?? [], effective.ano - 10), [effective.ano, pyramid.data])
  const tableItems = series.data?.items ?? []
  const currentRow = tableItems.find((row) => Number(row.ano) === effective.ano)
  const priorRow = tableItems.find((row) => Number(row.ano) === effective.ano - 10)
  const lifeItems = life.data?.items ?? []
  const place = territories.data?.find((item) => item.cod === effective.cod)
  const narrativeCtx = useMemo<NarrativeContext>(() => {
    const key = spec.kpis[0]?.key ?? "populacao"
    const series = tableItems
      .map((row) => ({ ano: Number(row.ano), valor: Number(row[key]) }))
      .filter((row) => Number.isFinite(row.ano) && Number.isFinite(row.valor))
      .sort((a, b) => a.ano - b.ano)
    return {
      datasetId: spec.id,
      territorio: { cod: effective.cod, nome: place?.local ?? "Brasil", nivel: place?.nivel ?? "brasil" },
      ano: effective.ano,
      sexo: effective.sexo,
      selection: {},
      data: { series, projectionFrom: calendarYear() },
    }
  }, [effective.ano, effective.cod, effective.sexo, place?.local, place?.nivel, spec.id, spec.kpis, tableItems])
  const insights = useMemo(() => finalObservations(buildNarratives(narrativeCtx)), [narrativeCtx])

  const values = useMemo(() => {
    const map = new Map<string, number | string | null>()
    if (spec.id === "ds1") {
      const current = ageKpis(yearRows, sexo)
      for (const [key, value] of Object.entries(current)) map.set(key, value)
    } else if (spec.id === "ds2") {
      const current = groupKpis(yearRows, sexo)
      for (const [key, value] of Object.entries(current)) map.set(key, value)
    } else if (spec.id === "ds5") {
      map.set("e0", valueAtAge(lifeItems, sexo, 0, "ex"))
      map.set("e60", valueAtAge(lifeItems, sexo, 60, "ex"))
      map.set("nqx_0", valueAtAge(lifeItems, sexo, 0, "nqx"))
      const survivors = valueAtAge(lifeItems, sexo, 80, "lx")
      map.set("lx_80", survivors)
    } else if (currentRow) {
      const cross = crossingYear(
        linePoints(tableItems, ["p_0_14_t", "p_60_mais_t"]).map((row) => ({
          ano: row.ano,
          a: row.p_0_14_t ?? null,
          b: row.p_60_mais_t ?? null,
        })),
      )
      if (cross != null) map.set("ano_cruzamento", cross)
      for (const kpi of spec.kpis) map.set(kpi.key, num(currentRow[kpi.key]))
    }
    return map
  }, [currentRow, lifeItems, sexo, spec.id, tableItems, yearRows])

  const dictionary = new Map((metrics.data ?? []).map((item) => [item.coluna, item]))
  const reprocess = useMutation({
    mutationFn: () => processDataset(spec.id, { source: "original", confirm: false, cleaning: { outlier_strategy: "flag" } }),
    onSuccess: async () => {
      toast.success("Reprocessamento concluído")
      await queryClient.invalidateQueries({ queryKey: ["dataset", spec.id] })
      await queryClient.invalidateQueries({ queryKey: ["datasets"] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const columns = useMemo<ColumnDef<Record<string, unknown>, unknown>[]>(
    () =>
      spec.tableColumns.map((key, index) => ({
        id: key,
        accessorFn: (row) => row[key],
        header: COLUMN_LABELS[key] ?? dictionary.get(key)?.rotulo_original ?? key,
        meta: index >= 2 ? { priority: "low" } : undefined,
        cell: (context) => (key === "is_outlier" ? (isOutlier(context.getValue()) ? "Sim" : "Não") : cellText(context.getValue(), key)),
      })),
    [dictionary, spec.tableColumns],
  )

  const confirming = useMemo(() => {
    const fromClaims = (claims.data ?? []).flatMap((claim) => claim.news ?? [])
    const fromFeed = news.data?.items ?? []
    const merged = [...fromClaims, ...fromFeed]
    const seen = new Set<string>()
    const unique: NewsItem[] = []
    for (const item of merged) {
      const id = String(item.id ?? item.link ?? item.titulo)
      if (seen.has(id)) continue
      seen.add(id)
      unique.push(item)
      if (unique.length === 3) break
    }
    return unique
  }, [claims.data, news.data?.items])

  const last = info?.last_run
  const description = last
    ? `IBGE, Projeções da População – Revisão 2024. Último processamento: ${last.source ?? "—"}, ${formatBy("integer", last.rows_out ?? 0)} linhas.`
    : "IBGE, Projeções da População – Revisão 2024. Ainda sem processamento nesta base."

  return (
    <div className="page-stack">
      <PageHeader
        title={meta?.title ?? spec.id}
        description={description}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => reprocess.mutate()} disabled={reprocess.isPending}>
              Reprocessar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Baixar</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <a href={downloadHref(spec.id, "csv")}>CSV</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={downloadHref(spec.id, "xlsx")}>XLSX</a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setUploadOpen(true)}>Enviar arquivo</Button>
          </div>
        }
      />
      <FilterChipsBar />
      {pyramid.isError || series.isError || life.isError ? (
        <ErrorState
          message="Não foi possível carregar os dados deste território."
          onRetry={() => {
            void pyramid.refetch()
            void series.refetch()
            void life.refetch()
          }}
        />
      ) : null}
      <FilterBar
        territories={territories.data ?? []}
        filters={spec.filters}
        cod={filters.cod}
        ano={filters.ano}
        sexo={filters.sexo}
        onCod={filters.setCod}
        onAno={filters.setAno}
        onSexo={filters.setSexo}
      />
      <section className="dashboard-grid" aria-label="Indicadores">
        {activeKpis.map((kpi) => {
          const raw = values.get(kpi.key)
          const numeric = typeof raw === "number" ? raw : null
          const prior = priorValue(spec.id, kpi.key, priorPyramid, priorRow, sexo)
          const delta = kpi.deltaYears && typeof raw === "number" ? deltaValue(numeric, prior, kpi.format) : null
          return (
            <KpiCard
              key={kpi.key}
              metricKey={kpi.key}
              label={kpi.label}
              value={numeric}
              display={typeof raw === "string" ? raw : undefined}
              format={asFormat(kpi.format)}
              delta={delta}
              loading={pyramidEnabled ? pyramid.isLoading : spec.id === "ds5" ? life.isLoading : series.isLoading}
            />
          )
        })}
      </section>
      <div className="chart-board">
        {activeCharts.map((chart, index) => {
          const span = packRows(activeCharts.map((item) => item.span ?? 6))[index]
          return (
            <div key={chart.title} className={`span-${span}`}>
              {chart.kind === "facts" ? (
                <FactsCard facts={facts.data} factsCod={facts.factsCod} territoryCod={facts.territoryCod} loading={facts.isLoading} />
              ) : chart.kind === "context" ? (
                <ContextCard
                  hasCenso={spec.showCensoReference}
                  loading={censo.isLoading || claims.isLoading}
                  error={censo.error}
                  data={censo.data}
                  onRetry={() => {
                    void censo.refetch()
                    void claims.refetch()
                  }}
                />
              ) : chart.kind === "lifeTable" && chart.metric === "nqx" ? (
                <NqxCompare spec={spec} cod={effective.cod} year={effective.ano} sexo={effective.sexo} />
              ) : (
                <ChartSlot
                  spec={chart}
                  page={spec}
                  yearRows={yearRows}
                  allPyramid={pyramid.data ?? []}
                  year={effective.ano}
                  onYear={filters.setAno}
                  sexo={effective.sexo}
                  cod={effective.cod}
                  compareYear={compareYear}
                  onCompareYear={setCompareYear}
                  seriesItems={tableItems}
                  rankItems={ranking.data?.items ?? []}
                  lifeItems={lifeItems}
                  compareLife={lifeItems}
                  placeName={place?.local ?? "Brasil"}
                  loading={chartLoading(chart, pyramid.isLoading, series.isLoading, ranking.isLoading, life.isLoading)}
                  error={chartError(chart, pyramid.error, series.error, ranking.error, life.error)}
                  onRetry={() => {
                    void pyramid.refetch()
                    void series.refetch()
                    void ranking.refetch()
                    void life.refetch()
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
      <ObservationsCard insights={insights} />
      <section className="page-stack" aria-label="Notícias que confirmam">
        <h2 className="text-sm font-medium">Notícias que confirmam</h2>
        {news.data && news.data.available === false ? (
          <p className="text-xs text-muted-foreground">Fonte de notícias indisponível. Exibindo o conteúdo em cache.</p>
        ) : null}
        {confirming.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma notícia associada ainda.</p>
        ) : (
          <div className="chart-board grid items-stretch">
            {confirming.map((item, index) => (
              <div key={String(item.id ?? item.link)} className={`span-${packRows(confirming.map(() => 4))[index]}`}>
              <NewsCard
                title={item.titulo ?? "Notícia IBGE"}
                summary={item.introducao ?? ""}
                date={item.data_publicacao ?? ""}
                url={item.link ?? "https://agenciadenoticias.ibge.gov.br/"}
                image={item.imagem ?? undefined}
              />
              </div>
            ))}
          </div>
        )}
      </section>
      <DataTable
        columns={columns}
        queryKey={["dataset", spec.id, "table", effective.ano, effective.cod, spec.filters.includes("sexo") ? effective.sexo : ""]}
        rowClassName={(row) => (isOutlier(row.is_outlier) ? "bg-muted" : undefined)}
        fetcher={async (params) => {
          const page = await fetchData(spec.id, {
            page: params.page,
            pageSize: params.pageSize,
            sort: params.sort,
            desc: params.desc,
            ano: effective.ano,
            cod: effective.cod,
            sexo: spec.filters.includes("sexo") ? filters.sexo : undefined,
          })
          return { rows: page.items, total: page.total }
        }}
      />
      <UploadDialog datasetId={spec.id} open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  )
}

function priorValue(
  id: string,
  key: string,
  priorPyramid: PyramidRow[],
  priorRow: Record<string, unknown> | undefined,
  sexo: string,
) {
  if (id === "ds1") {
    const prior = ageKpis(priorPyramid, sexo)
    const value = prior[key as keyof typeof prior]
    return typeof value === "number" ? value : null
  }
  if (id === "ds2") {
    const prior = groupKpis(priorPyramid, sexo)
    const value = prior[key as keyof typeof prior]
    return typeof value === "number" ? value : null
  }
  return num(priorRow?.[key])
}

function chartLoading(spec: ChartSpec | undefined, pyramid: boolean, series: boolean, ranking: boolean, life: boolean) {
  if (!spec) return false
  if (spec.kind === "pyramid") return pyramid
  if (spec.kind === "ranking") return ranking
  if (spec.kind === "lifeTable") return life
  if (spec.kind === "area100") return pyramid
  return series
}

function chartError(spec: ChartSpec | undefined, pyramid: unknown, series: unknown, ranking: unknown, life: unknown) {
  const error = !spec
    ? null
    : spec.kind === "pyramid" || spec.kind === "area100"
      ? pyramid
      : spec.kind === "ranking"
        ? ranking
        : spec.kind === "lifeTable"
          ? life
          : series
  return error instanceof Error ? error.message : null
}

function ContextCard({
  hasCenso,
  loading,
  error,
  data,
  onRetry,
}: {
  hasCenso: boolean
  loading: boolean
  error: unknown
  data?: { available: boolean; projecao: number | null; censo: number | null; diff_pct: number | null; nota: string }
  onRetry: () => void
}) {
  const censoReady = Boolean(data?.available && data.censo != null)
  const diff = data?.diff_pct == null ? null : Math.abs(data.diff_pct) > 1 ? data.diff_pct / 100 : data.diff_pct
  return (
    <ChartCard title="Contexto" loading={loading} error={error instanceof Error ? error.message : null} onRetry={onRetry}>
      <div className="flex h-full min-h-0 flex-col overflow-y-auto">
        {hasCenso ? (
          <section className="grid gap-1 text-sm" aria-label="Censo 2022">
            <h3 className="font-medium">Censo 2022</h3>
            {censoReady ? (
              <>
                <p>Projeção: {formatBy("integer", data?.projecao ?? null)}</p>
                <p>Recenseada: {formatBy("integer", data?.censo ?? null)}</p>
                <p>Diferença: {diff == null ? "Dado do Censo indisponível no momento" : formatValue(diff, { key: "diff", kind: "percent" })}</p>
                {data?.nota ? <p className="text-muted-foreground">{data.nota}</p> : null}
              </>
            ) : (
              <p>Dado do Censo indisponível no momento</p>
            )}
          </section>
        ) : null}
        {hasCenso ? null : <p className="text-sm text-muted-foreground">Sem referência do Censo 2022 nesta página.</p>}
      </div>
    </ChartCard>
  )
}

type SlotProps = {
  spec?: ChartSpec
  page: DashboardSpec
  yearRows: PyramidRow[]
  allPyramid: PyramidRow[]
  year: number
  onYear: (year: number) => void
  sexo: string
  cod: number
  compareYear: number
  onCompareYear: (year: number) => void
  seriesItems: Record<string, unknown>[]
  rankItems: Record<string, unknown>[]
  lifeItems: Record<string, unknown>[]
  compareLife: Record<string, unknown>[]
  loading: boolean
  error: string | null
  onRetry: () => void
  placeName?: string
}

function chartMetricKey(spec: ChartSpec) {
  if (spec.kind === "context") return "populacao"
  if (spec.kind === "pyramid" || spec.kind === "heatmap") return "populacao"
  if (spec.kind === "ranking") return spec.metricOptions[0]?.key ?? "populacao"
  if (spec.kind === "lifeTable") return spec.metric
  if (spec.kind === "map" || spec.kind === "slope") return spec.metric
  if (spec.kind === "scatter" || spec.kind === "diverging") return "e0_t"
  if (spec.kind === "bonus") return "rdt65"
  if (spec.kind === "milestones") return "ano"
  return spec.series[0]?.key ?? "populacao"
}

function ChartSlot(props: SlotProps) {
  const spec = props.spec
  if (!spec || spec.kind === "context" || spec.kind === "facts") return null
  const narrative = lineNarrative(spec, props.seriesItems, props.cod, props.placeName ?? "Brasil", props.year)
  if (isEnrichment(spec)) {
    return <EnrichmentChart spec={spec} datasetId={props.page.id} cod={props.cod} year={props.year} sexo={props.sexo} />
  }
  return (
    <ChartCard
      title={spec.title}
      metricKey={chartMetricKey(spec)}
      description={spec.description}
      loading={props.loading}
      error={props.error}
      onRetry={props.onRetry}
      narrative={narrative}
      actions={
        spec.kind === "pyramid" && spec.compare && spec.granularity === "idade" ? (
          <label className="grid text-xs">
            Ano em contorno
            <input
              className="h-8 w-20 rounded-md border border-border bg-background px-2"
              type="number"
              min={2000}
              max={2070}
              value={props.compareYear}
              onChange={(event) => props.onCompareYear(Number(event.target.value))}
            />
          </label>
        ) : null
      }
    >
      <ChartBody {...props} spec={spec} />
    </ChartCard>
  )
}

function lineNarrative(spec: ChartSpec, items: Record<string, unknown>[], cod: number, nome: string, year: number) {
  if (!("series" in spec) || !spec.series[0]) return undefined
  const points = (key: string) =>
    items
      .map((row) => ({ ano: Number(row.ano), valor: Number(row[key]) }))
      .filter((row) => Number.isFinite(row.ano) && Number.isFinite(row.valor))
      .sort((a, b) => a.ano - b.ano)
  const series = points(spec.series[0].key)
  if (series.length < 2) return undefined
  const second = spec.series[1]?.key
  return buildNarratives({
    datasetId: spec.title,
    chartId: spec.title,
    territorio: { cod, nome, nivel: cod === 0 ? "brasil" : "uf" },
    ano: year,
    sexo: "Ambos",
    selection: {},
    series: spec.series.map((item) => ({ key: item.key, label: seriesLabel(item.key) })),
    narrativePriority: "markCrossing" in spec && spec.markCrossing ? ["crossing", "trend"] : undefined,
    data: { series, seriesB: second ? points(second) : undefined, projectionFrom: calendarYear() },
  })[0]?.text
}

function seriesLabel(key: string) {
  return SERIES_LABELS[key] ?? key
}

function ChartBody({ spec, yearRows, allPyramid, year, onYear, sexo, cod, compareYear, seriesItems, rankItems, lifeItems }: SlotProps & { spec: ChartSpec }) {
  if (isEnrichment(spec)) return null
  if (spec.kind === "pyramid") {
    const broad = spec.granularity === "ampla"
    const current = broad ? broadBands(spec.compare ? rowsForYear(allPyramid, 2000) : yearRows) : yearRows
    const outlines = broad && spec.compare
      ? [{ id: "futuro", label: "2070", rows: broadBands(rowsForYear(allPyramid, 2070)) }]
      : spec.granularity === "quinquenal"
        ? [
            { id: "base", label: "2000", rows: rowsForYear(allPyramid, 2000) },
            { id: "futuro", label: "2070", rows: rowsForYear(allPyramid, 2070) },
          ]
        : spec.compare
          ? [{ id: "comparacao", label: String(compareYear), rows: rowsForYear(allPyramid, compareYear) }]
          : []
    const total = current.reduce((sum, row) => sum + (Number(row.homens) || 0) + (Number(row.mulheres) || 0), 0)
    return (
      <PopulationPyramid
        rows={current}
        outlines={outlines}
        granularity={spec.granularity === "idade" ? "idade" : "quinquenal"}
        year={broad && spec.compare ? 2000 : year}
        onYear={onYear}
        animate={spec.animate}
        summary={`A pirâmide reúne ${formatValue(total, { key: "populacao", kind: "count" })} pessoas em ${broad && spec.compare ? "2000" : year}.`}
      />
    )
  }
  if (spec.kind === "ranking") {
    const rowsByMetric: Record<string, RankRow[]> = {}
    for (const option of spec.metricOptions) {
      rowsByMetric[option.key] = rankItems
        .map((row) => ({
          cod: Number(row.cod),
          label: String(row.sigla ?? row.local ?? row.cod),
          value: num(row[option.key]) ?? 0,
        }))
        .filter((row) => Number.isFinite(row.cod))
    }
    return (
      <RankingBars
        rowsByMetric={rowsByMetric}
        options={spec.metricOptions.map((item) => ({ ...item, format: asFormat(item.format) }))}
        selectedCod={cod}
        summary={spec.description}
      />
    )
  }
  if (spec.kind === "lifeTable" && spec.metric !== "nqx") {
    const data = lifePoints(lifeItems, spec.metric, ["h", "m"])
    return (
      <LifeTableChart
        data={data}
        series={[
          { key: "homens", label: "Homens" },
          { key: "mulheres", label: "Mulheres" },
        ]}
        summary={spec.description}
      />
    )
  }
  if (spec.kind === "lifeTable") return null
  if (spec.kind !== "line" && spec.kind !== "area" && spec.kind !== "area100") return null
  if (spec.kind === "area100") {
    const data = compositionSeries(allPyramid, sexo)
    return (
      <ProjectionLine
        data={data}
        series={spec.series.map((item) => ({ key: item.key, label: seriesLabel(item.key), format: asFormat(item.format) }))}
        variant="area100"
        summary={spec.description}
      />
    )
  }
  const keys = spec.series.map((item) => item.key)
  const data: ({ ano: number } & Record<string, number | null>)[] =
    keys.includes("populacao") && allPyramid.length
      ? populationSeries(allPyramid, sexo)
      : linePoints(seriesItems, keys)
  const peak = spec.markMax ? peakPoint(data.map((row) => ({ ano: row.ano, valor: row[keys[0] ?? ""] ?? null }))) : null
  const cross = spec.markCrossing ? crossingYear(data.map((row) => ({ ano: row.ano, a: row[spec.markCrossing![0]] ?? null, b: row[spec.markCrossing![1]] ?? null }))) : null
  const summary = peak
    ? `O total chega a ${formatValue(peak.valor, { key: keys[0] ?? "populacao", kind: "count" })} em ${peak.ano}.`
    : cross
      ? `As duas linhas se cruzam em ${cross}.`
      : spec.description
  const refLine = spec.refLine
    ? spec.refLine
    : undefined
  return (
    <ProjectionLine
      data={data}
      series={spec.series.map((item) => ({ key: item.key, label: seriesLabel(item.key), format: asFormat(item.format) }))}
      variant={spec.kind}
      refLine={refLine}
      markCrossing={spec.markCrossing}
      markMax={spec.markMax}
      logY={spec.logY}
      summary={summary}
    />
  )
}

function NqxCompare({ spec, cod, year, sexo }: { spec: DashboardSpec; cod: number; year: number; sexo: string }) {
  const chart = spec.charts.find((item) => item.kind === "lifeTable" && item.metric === "nqx")
  const [other, setOther] = useState(2000)
  const current = useRows(spec.id, { ano: year, cod, pageSize: 200 }, Boolean(chart))
  const previous = useRows(spec.id, { ano: other, cod, pageSize: 200 }, Boolean(chart))
  if (!chart || chart.kind !== "lifeTable") return null
  const kind = sexKind(sexo)
  const data = mergeNqx(current.data?.items ?? [], previous.data?.items ?? [], kind)
  return (
    <ChartCard
      title={chart.title}
      description={chart.description}
      loading={current.isLoading || previous.isLoading}
      error={current.error instanceof Error ? current.error.message : previous.error instanceof Error ? previous.error.message : null}
      onRetry={() => {
        void current.refetch()
        void previous.refetch()
      }}
      actions={
        <label className="grid text-xs">
          Comparar com
          <input className="h-8 w-20 rounded-md border border-border bg-background px-2" type="number" min={2000} max={2070} value={other} onChange={(event) => setOther(Number(event.target.value))} />
        </label>
      }
    >
      <LifeTableChart
        data={data}
        logY
        series={[
          { key: "atual", label: String(year) },
          { key: "outro", label: String(other) },
        ]}
        summary={`nqx em escala logarítmica, ${year} e ${other}.`}
      />
    </ChartCard>
  )
}

function mergeNqx(current: Record<string, unknown>[], previous: Record<string, unknown>[], kind: "t" | "h" | "m") {
  const read = (items: Record<string, unknown>[]) => {
    const map = new Map<number, number | null>()
    for (const row of items) {
      if (sexKind(String(row.sexo ?? "")) !== kind) continue
      map.set(Number(row.idade), num(row.nqx))
    }
    return map
  }
  const left = read(current)
  const right = read(previous)
  const ages = [...new Set([...left.keys(), ...right.keys()])].filter((age) => Number.isFinite(age)).sort((a, b) => a - b)
  return ages.map((idade) => ({ idade, atual: left.get(idade) ?? null, outro: right.get(idade) ?? null }))
}
