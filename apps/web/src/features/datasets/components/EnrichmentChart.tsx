import { useQuery } from "@tanstack/react-query"
import { ChartCard } from "@/components/common/ChartCard"
import { AgeYearHeatmap } from "@/components/charts/AgeYearHeatmap"
import { AnimatedScatter } from "@/components/charts/AnimatedScatter"
import { BrazilMap } from "@/components/charts/BrazilMap"
import { DemographicBonus } from "@/components/charts/DemographicBonus"
import { DivergingBars } from "@/components/charts/DivergingBars"
import { MilestonesTimeline } from "@/components/charts/MilestonesTimeline"
import { SlopeChart } from "@/components/charts/SlopeChart"
import {
  fetchData,
  fetchHeatmap,
  fetchMap,
  fetchMilestones,
  fetchScatter,
  fetchSlope,
} from "@/features/datasets/api"
import type { GapItem } from "@/components/charts/DivergingBars"
import type { ChartSpec } from "@/features/datasets/dashboards.config"
import { useCrossFilter } from "@/stores/crossfilter"
import type { MetricKind } from "@/lib/format"
import { STALE_TIME } from "@/lib/queryClient"

function kindOf(format: string): MetricKind {
  if (format === "int") return "count"
  if (format === "percent") return "percent"
  if (format === "permil") return "permil"
  if (format === "years") return "years"
  return "rate"
}

const ENRICHMENT_KINDS = ["map", "heatmap", "scatter", "slope", "bonus", "diverging", "milestones"] as const

export function isEnrichment(spec: ChartSpec): spec is Extract<ChartSpec, { kind: (typeof ENRICHMENT_KINDS)[number] }> {
  return (ENRICHMENT_KINDS as readonly string[]).includes(spec.kind)
}

export function EnrichmentChart({ spec, datasetId, cod, year, sexo }: { spec: ChartSpec; datasetId: string; cod: number; year: number; sexo: string }) {
  const simple = false
  const selection = useCrossFilter((state) => state.selection)
  const toggle = useCrossFilter((state) => state.toggle)
  const enabled = isEnrichment(spec)
  const mapMetric = spec.kind === "map" ? spec.metric : ""
  const slopeMetric = spec.kind === "slope" ? spec.metric : ""
  const map = useQuery({
    queryKey: ["map", datasetId, mapMetric, year],
    queryFn: () => fetchMap(datasetId, mapMetric, year),
    enabled: spec.kind === "map",
    staleTime: STALE_TIME,
  })
  const heat = useQuery({
    queryKey: ["heatmap", cod, sexo],
    queryFn: () => fetchHeatmap(cod, sexo),
    enabled: spec.kind === "heatmap",
    staleTime: STALE_TIME,
  })
  const scatter = useQuery({
    queryKey: ["scatter"],
    queryFn: () => fetchScatter(),
    enabled: spec.kind === "scatter",
    staleTime: STALE_TIME,
  })
  const slope = useQuery({
    queryKey: ["slope", datasetId, slopeMetric, year],
    queryFn: () => fetchSlope(datasetId, slopeMetric, 2000, year === 2000 ? 2070 : year),
    enabled: spec.kind === "slope",
    staleTime: STALE_TIME,
  })
  const marks = useQuery({
    queryKey: ["milestones", spec.kind === "diverging" && simple ? 0 : cod],
    queryFn: () => fetchMilestones(spec.kind === "diverging" && simple ? 0 : cod),
    enabled: spec.kind === "bonus" || spec.kind === "milestones",
    staleTime: STALE_TIME,
  })
  const bonusSeries = useQuery({
    queryKey: ["bonus-series", cod],
    queryFn: () => fetchData("ds4", { cod, pageSize: 100 }),
    enabled: spec.kind === "bonus",
    staleTime: STALE_TIME,
  })
  const gaps = useQuery({
    queryKey: ["gaps", datasetId, year, simple],
    queryFn: () => loadGaps(datasetId, year),
    enabled: spec.kind === "diverging",
    staleTime: STALE_TIME,
  })
  if (!enabled) return null
  const active =
    spec.kind === "map" ? map : spec.kind === "heatmap" ? heat : spec.kind === "scatter" ? scatter : spec.kind === "slope" ? slope : spec.kind === "diverging" ? gaps : marks
  const bonusLoading = spec.kind === "bonus" && (marks.isLoading || bonusSeries.isLoading)
  return (
    <ChartCard
      title={spec.title}
      description={spec.description}
      loading={bonusLoading || active.isLoading}
      error={active.error instanceof Error ? active.error.message : null}
      onRetry={() => void active.refetch()}
    >
      {spec.kind === "map" ? (
        <>
          <BrazilMap
            items={map.data?.items ?? []}
            metric={{ key: spec.metric, kind: kindOf(spec.format) }}
            summary={spec.description}
            selected={selection.uf ?? []}
            onSelect={(value, multi) => toggle("uf", value, { multi: simple ? false : multi, source: "map" })}
          />
          {selection.faixa?.length ? (
            <p className="text-xs text-muted-foreground">Este gráfico não é afetado pela seleção de faixa etária.</p>
          ) : null}
        </>
      ) : null}
      {spec.kind === "heatmap" ? (
        <AgeYearHeatmap
          cells={heat.data?.cells ?? []}
          summary={spec.description}
          onSelectAge={(idade) => toggle("faixa", String(idade), { multi: false, source: "heatmap" })}
        />
      ) : null}
      {spec.kind === "scatter" ? (
        <AnimatedScatter
          points={scatter.data?.items ?? []}
          summary={spec.description}
          onSelect={(value) => toggle("uf", value, { multi: false, source: "scatter" })}
        />
      ) : null}
      {spec.kind === "slope" && spec.kind === "slope" ? (
        <SlopeChart
          items={slope.data?.items ?? []}
          anoA={2000}
          anoB={year === 2000 ? 2070 : year}
          metric={{ key: spec.metric, kind: kindOf(spec.format) }}
          summary={spec.description}
          onSelect={(value) => toggle("uf", value, { multi: false, source: "slope" })}
        />
      ) : null}
      {spec.kind === "diverging" ? (
        <DivergingBars
          items={gaps.data ?? []}
          summary={spec.description}
          onSelect={(value) => toggle("uf", value, { multi: false, source: "diverging" })}
        />
      ) : null}
      {spec.kind === "bonus" ? (
        <DemographicBonus
          data={(bonusSeries.data?.items ?? [])
            .map((row) => ({ ano: Number(row.ano), rdt65: Number(row.rdt65) }))
            .filter((row) => Number.isFinite(row.ano))}
          series={[{ key: "rdt65", label: simple ? "Dependentes" : "RDT65", format: "decimal" }]}
          window={
            marks.data?.bonus.ano_inicio != null && marks.data.bonus.ano_fim != null
              ? { x1: marks.data.bonus.ano_inicio, x2: marks.data.bonus.ano_fim }
              : null
          }
          turning={marks.data?.bonus.ponto_virada ?? null}
          summary={spec.description}
        />
      ) : null}
      {spec.kind === "milestones" ? (
        <MilestonesTimeline
          summary={spec.description}
          items={[
            { id: "pico", ano: marks.data?.pico.ano ?? null, label: simple ? "A população chega ao máximo" : "Pico populacional" },
            { id: "idosos", ano: marks.data?.cruzamento_idosos_jovens.ano ?? null, label: simple ? "Idosos passam as crianças" : "60+ supera 0–14" },
            { id: "tft", ano: marks.data?.tft_abaixo_reposicao.ano ?? null, label: simple ? "Passa a nascer menos do que o necessário" : "TFT abaixo de 2,1" },
            { id: "nasc", ano: marks.data?.nascimentos_abaixo_obitos.ano ?? null, label: simple ? "Mortes passam os nascimentos" : "Nascimentos abaixo dos óbitos" },
          ]}
        />
      ) : null}
    </ChartCard>
  )
}

async function loadGaps(datasetId: string, year: number) {
  if (datasetId === "ds5") {
    const [born, older] = await Promise.all([
      fetchData("ds5", { ano: year, idade: 0, pageSize: 200 }),
      fetchData("ds5", { ano: year, idade: 60, pageSize: 200 }),
    ])
    return gapsFromLife([...born.items, ...older.items])
  }
  const page = await fetchData("ds4", { ano: year, nivel: "uf", pageSize: 50 })
  return page.items.map((row) => ({
    cod: Number(row.cod),
    sigla: String(row.sigla ?? row.local ?? row.cod),
    local: String(row.local ?? row.sigla ?? ""),
    e0_h: numberOrNull(row.e0_h),
    e0_m: numberOrNull(row.e0_m),
    e60_h: numberOrNull(row.e60_h),
    e60_m: numberOrNull(row.e60_m),
  }))
}

function gapsFromLife(rows: Record<string, unknown>[]): GapItem[] {
  const grouped = new Map<number, GapItem>()
  for (const row of rows) {
    const cod = Number(row.cod)
    if (String(row.nivel ?? "") !== "uf") continue
    const current = grouped.get(cod) ?? {
      cod,
      sigla: String(row.sigla ?? row.cod),
      local: String(row.local ?? ""),
      e0_h: null,
      e0_m: null,
      e60_h: null,
      e60_m: null,
    }
    const sex = String(row.sexo ?? "").toLowerCase()
    const age = Number(row.idade)
    const value = numberOrNull(row.ex)
    if (sex.startsWith("hom") && age === 0) current.e0_h = value
    if (sex.startsWith("mul") && age === 0) current.e0_m = value
    if (sex.startsWith("hom") && age === 60) current.e60_h = value
    if (sex.startsWith("mul") && age === 60) current.e60_m = value
    grouped.set(cod, current)
  }
  return [...grouped.values()]
}

function numberOrNull(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}
