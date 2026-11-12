import { useTerritories } from "@/features/datasets/hooks"
import type { FactItem } from "@/features/datasets/api"
import { StatusBadge } from "@/components/common/StatusBadge"
import { metricById } from "@/content/metricas"
import { formatValue, type MetricKind } from "@/lib/format"
import { CountUp } from "@/motion/CountUp"
import { Reveal } from "@/motion/useMotion"
import { CharFade, WordReveal } from "@/motion/WordReveal"
import { useMode } from "@/stores/preferences"

const FACT_METRIC: Record<string, string> = {
  ie60: "ie60",
  tft: "tft",
  tmi: "tmi_t",
  e0: "e0",
  e0_sexo: "e0_t",
  e0_longo: "e0_t",
  e0_covid: "e0_t",
  e60: "e60",
  l80: "lx_80",
  l80_longo: "lx_80",
  l60: "lx_80",
  q0: "nqx_0",
  rd_min: "rdt65",
  id_med: "id_med",
}

function factMetric(factId: string, kind: MetricKind) {
  if (kind === "year" || kind === "percent" || kind === "count") return null
  const id = FACT_METRIC[factId] ?? factId
  return metricById(id) ? id : null
}

const NAMES: Record<number, string> = {
  0: "Brasil",
  1: "Norte",
  2: "Nordeste",
  3: "Sudeste",
  4: "Sul",
  5: "Centro-Oeste",
}

function detailPoints(fact: FactItem) {
  const points = fact.detail_values
  if (!points?.length) return null
  const repeated = new Set<number>()
  for (const point of points) {
    if (repeated.has(point.ano) && !point.rotulo) return null
    repeated.add(point.ano)
  }
  return points
}

export function detailText(fact: FactItem, mode: "technical" | "simple") {
  const points = detailPoints(fact)
  if (!points) return fact.detail ?? ""
  return points
    .map((point) => {
      const metricId = factMetric(fact.id, point.kind as MetricKind)
      const formatted = metricId
        ? formatValue(point.valor, metricId, mode)
        : formatValue(point.valor, { key: fact.id, kind: point.kind as MetricKind }, mode)
      if (point.rotulo?.includes("{valor}")) return point.rotulo.replaceAll("{valor}", formatted)
      if (point.rotulo) return `${point.rotulo}: ${formatted}`
      return `${point.ano}: ${formatted}`
    })
    .join(" · ")
}

export function visibleFacts(facts: FactItem[] | undefined) {
  return (facts ?? []).slice(0, 10)
}

function FactNumber({ value, metricKey, kind, mode }: { value: number; metricKey: string; kind: FactItem["kind"]; mode: "technical" | "simple" }) {
  const catalog = factMetric(metricKey, kind as MetricKind)
  const metric = { key: catalog ?? metricKey, kind: kind as MetricKind }
  if (kind === "year") return <>{formatValue(value, metric, mode)}</>
  if (catalog) return <CountUp value={value} metricKey={catalog} metric={{ key: catalog, kind: kind as MetricKind }} />
  return <CountUp value={value} metric={metric} />
}

function FactFigures({ fact, mode }: { fact: FactItem; mode: "technical" | "simple" }) {
  const detail = detailText(fact, mode)
  const points = detailPoints(fact)
  if (typeof fact.value !== "number") return <>{`${fact.value}${detail ? ` · ${detail}` : ""}`}</>
  return (
    <>
      <FactNumber value={fact.value} metricKey={fact.id} kind={fact.kind} mode={mode} />
      {points
        ? points.map((point, index) => {
            const number = <FactNumber value={point.valor} metricKey={fact.id} kind={point.kind} mode={mode} />
            if (point.rotulo?.includes("{valor}")) {
              const [before, after] = point.rotulo.split("{valor}")
              return (
                <span key={`${point.ano}-${index}`}>
                  {" · "}
                  {before}
                  {number}
                  {after}
                </span>
              )
            }
            if (point.rotulo) {
              return (
                <span key={`${point.ano}-${index}`}>
                  {" · "}
                  {point.rotulo}: {number}
                </span>
              )
            }
            return (
              <span key={`${point.ano}-${index}`}>
                {" · "}
                {point.ano}: {number}
              </span>
            )
          })
        : detail
          ? ` · ${detail}`
          : null}
    </>
  )
}

export function FactList({ facts }: { facts: FactItem[] }) {
  const mode = useMode()
  return (
    <ul className="divide-y divide-border border-y border-border">
      {facts.map((fact) => (
        <li key={fact.id} className="flex flex-wrap items-baseline justify-between gap-x-4 py-1.5 text-sm leading-5">
          <span className="inline-flex items-center gap-2">
            <WordReveal as="span" text={fact.label} />
            {fact.status ? <StatusBadge status={fact.status} /> : null}
          </span>
          <span className="font-medium tabular-nums">
            <FactFigures fact={fact} mode={mode} />
          </span>
        </li>
      ))}
    </ul>
  )
}

export function FactsCard({ facts, factsCod, territoryCod, loading }: { facts: FactItem[] | undefined; factsCod: number; territoryCod: number; loading?: boolean }) {
  const territories = useTerritories()
  const name = territories.data?.find((item) => item.cod === factsCod)?.local ?? NAMES[factsCod] ?? "Brasil"
  const note = territoryCod !== factsCod ? " (fatos disponíveis para Brasil e regiões)" : ""
  const shown = visibleFacts(facts)
  return (
    <Reveal>
    <section data-card className="rounded-lg border border-border p-4" aria-label="Fatos">
      <CharFade as="h2" className="text-sm font-medium" text="Fatos" />
      <CharFade as="p" className="mt-1 text-sm text-muted-foreground" text={`Fatos de: ${name}${note}`} />
      {loading ? <p className="mt-3 text-sm">Carregando fatos…</p> : null}
      {shown.length ? (
        <div className="mt-3">
          <FactList facts={shown} />
        </div>
      ) : null}
    </section>
    </Reveal>
  )
}
