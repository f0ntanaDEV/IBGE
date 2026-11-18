import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { ChartCard } from "@/components/common/ChartCard"
import { CHART_HELP } from "@/features/datasets/chartHelp"
import { useFilterActions, useTerritories } from "@/features/datasets/hooks"
import { TERRITORIES } from "@/features/datasets/territories"
import { ufsForScope } from "@/features/datasets/territoryScope"
import { chartId } from "@/lib/chartId"
import { AgeYearHeatmap } from "@/components/charts/AgeYearHeatmap"
import { AnimatedScatter } from "@/components/charts/AnimatedScatter"
import { BrazilMap } from "@/components/charts/BrazilMap"
import { DemographicBonus } from "@/components/charts/DemographicBonus"
import { MilestonesTimeline } from "@/components/charts/MilestonesTimeline"
import { UfColumns } from "@/components/charts/UfColumns"
import { YearPlayer } from "@/components/charts/YearPlayer"
import { SatelliteMap } from "@/components/charts/SatelliteMap"
import { zonesFor } from "@/lib/zones"
import { usePreferences } from "@/stores/preferences"
import {
  fetchData,
  fetchHeatmap,
  fetchMap,
  fetchMilestones,
  fetchScatter,
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
  const { setCod, setAno } = useFilterActions()
  const mapView = usePreferences((state) => state.mapView)
  const setMapView = usePreferences((state) => state.setMapView)
  const [satelliteNote, setSatelliteNote] = useState("")
  const [frame, setFrame] = useState(year)
  useEffect(() => {
    setFrame(year)
  }, [year])
  const territories = useTerritories()
  const scope = ufsForScope(cod, territories.data?.length ? territories.data : TERRITORIES)
  const allow = new Set(scope.ufs)
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
    queryKey: ["slope-years", datasetId, slopeMetric],
    queryFn: () => loadUfSeries(datasetId),
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
      chartId={chartId(spec.title)}
      description={spec.description}
      help={CHART_HELP[spec.title]}
      loading={bonusLoading || active.isLoading}
      error={active.error instanceof Error ? active.error.message : null}
      onRetry={() => void active.refetch()}
    >
      {spec.kind === "map" ? (
        <>
          <div className="mb-2 flex gap-2 text-xs" role="group" aria-label="Visão do mapa">
            {(
              [
                ["mapa", "Mapa"],
                ["contorno", "Contorno"],
                ["satelite", "Satélite"],
              ] as const
            ).map(([value, label]) => (
              <button key={value} type="button" className="rounded-md border border-border px-2 py-1" aria-pressed={mapView === value} onClick={() => setMapView(value)}>
                {label}
              </button>
            ))}
          </div>
          {satelliteNote ? <p className="text-xs text-muted-foreground">{satelliteNote}</p> : null}
          {mapView === "satelite" ? (
            <SatelliteMap
              selected={scope.highlight != null ? [scope.highlight] : scope.ufs}
              onSelect={setCod}
              onFail={() => {
                setMapView("mapa")
                setSatelliteNote("Imagem de satélite indisponível")
              }}
            />
          ) : (
          <BrazilMap
            items={map.data?.items ?? []}
            ufs={scope.ufs}
            highlight={scope.highlight}
            outline={mapView === "contorno"}
            metric={{ key: spec.metric, kind: kindOf(spec.format) }}
            summary={spec.description}
            selected={cod > 0 && cod <= 5 ? scope.ufs : scope.highlight != null ? [scope.highlight] : []}
            onSelect={(value) => setCod(value)}
          />
          )}
          {selection.faixa?.length ? (
            <p className="text-xs text-muted-foreground">Este gráfico não é afetado pela seleção de faixa etária.</p>
          ) : null}
        </>
      ) : null}
      {spec.kind === "heatmap" ? (
        <AgeYearHeatmap
          cells={heat.data?.cells ?? []}
          summary={spec.description}
          onSelectAge={(idade) => toggle(String(idade), { multi: false, source: "heatmap" })}
        />
      ) : null}
      {spec.kind === "scatter" ? (
        <AnimatedScatter
          points={(scatter.data?.items ?? []).filter((item) => allow.has(item.cod))}
          summary={spec.description}
          selected={scope.highlight != null ? [scope.highlight] : []}
          onSelect={(value) => setCod(value)}
        />
      ) : null}
      {spec.kind === "slope" ? (
        <div className="flex h-full min-h-0 flex-col gap-2">
          <YearPlayer year={frame} onYear={setFrame} />
          <UfColumns
            rows={(slope.data ?? [])
              .filter((row) => Number(row.ano) === frame && allow.has(Number(row.cod)))
              .map((row) => ({ cod: Number(row.cod), sigla: String(row.sigla ?? row.cod), valores: { valor: Number(row[slopeMetric]) } }))}
            series={[{ key: "valor", label: spec.title, color: "hsl(var(--chart-1))" }]}
            metric={{ key: slopeMetric, kind: kindOf(spec.format) }}
            selectedCods={scope.highlight != null ? [scope.highlight] : []}
            zones={zonesFor(slopeMetric)}
            summary={spec.description}
            onSelect={setCod}
          />
        </div>
      ) : null}
      {spec.kind === "diverging" ? (
        <UfColumns
          rows={(gaps.data ?? [])
            .filter((item) => allow.has(item.cod))
            .map((item) => ({
              cod: item.cod,
              sigla: item.sigla,
              valores: {
                nascer: item.e0_m != null && item.e0_h != null ? item.e0_m - item.e0_h : null,
                aos60: item.e60_m != null && item.e60_h != null ? item.e60_m - item.e60_h : null,
              },
            }))}
          series={[
            { key: "nascer", label: "Ao nascer", color: "hsl(var(--chart-4))" },
            { key: "aos60", label: "Aos 60", color: "hsl(var(--chart-1))" },
          ]}
          metric={{ key: "e0", kind: "years" }}
          selectedCods={scope.highlight != null ? [scope.highlight] : []}
          summary={spec.description}
          onSelect={setCod}
        />
      ) : null}
      {spec.kind === "bonus" ? (
        <DemographicBonus
          data={(bonusSeries.data?.items ?? [])
            .map((row) => ({ ano: Number(row.ano), rdt65: Number(row.rdt65) }))
            .filter((row) => Number.isFinite(row.ano))}
          series={[{ key: "rdt65", label: simple ? "Dependentes" : "Razão de dependência", format: "decimal" }]}
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
            { id: "tft", ano: marks.data?.tft_abaixo_reposicao.ano ?? null, label: simple ? "Passa a nascer menos do que o necessário" : "Filhos por mulher abaixo de 2,1" },
            { id: "nasc", ano: marks.data?.nascimentos_abaixo_obitos.ano ?? null, label: simple ? "Mortes passam os nascimentos" : "Nascimentos abaixo dos óbitos" },
          ]}
          onSelectYear={setAno}
        />
      ) : null}
    </ChartCard>
  )
}

async function loadUfSeries(datasetId: string) {
  const first = await fetchData(datasetId, { nivel: "uf", page: 1, pageSize: 200 })
  const pages = Math.ceil(first.total / 200)
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pages - 1) }, (_, index) => fetchData(datasetId, { nivel: "uf", page: index + 2, pageSize: 200 })),
  )
  return [first, ...rest].flatMap((page) => page.items)
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
