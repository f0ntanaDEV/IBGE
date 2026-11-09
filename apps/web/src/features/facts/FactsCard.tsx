import { useTerritories } from "@/features/datasets/hooks"
import type { FactItem } from "@/features/datasets/api"
import { formatValue, type MetricKind } from "@/lib/format"
import { useMode } from "@/stores/preferences"

const NAMES: Record<number, string> = {
  0: "Brasil",
  1: "Norte",
  2: "Nordeste",
  3: "Sudeste",
  4: "Sul",
  5: "Centro-Oeste",
}

function textValue(fact: FactItem, mode: "technical" | "simple") {
  if (typeof fact.value === "string") return fact.value
  return formatValue(fact.value, { key: fact.id, kind: fact.kind as MetricKind }, mode)
}

function detailText(fact: FactItem, mode: "technical" | "simple") {
  if (!fact.detail_values?.length) return fact.detail ?? ""
  return fact.detail_values
    .map((point) => `${point.ano}: ${formatValue(point.valor, { key: fact.id, kind: point.kind as MetricKind }, mode)}`)
    .join(" · ")
}

export function visibleFacts(facts: FactItem[] | undefined) {
  return (facts ?? []).slice(0, 10)
}

export function FactList({ facts }: { facts: FactItem[] }) {
  const mode = useMode()
  return (
    <ul className="divide-y divide-border border-y border-border">
      {facts.map((fact) => {
        const detail = detailText(fact, mode)
        return (
          <li key={fact.id} className="flex flex-wrap items-baseline justify-between gap-x-4 py-1.5 text-sm leading-5">
            <span>{fact.label}</span>
            <span className="font-medium tabular-nums">
              {textValue(fact, mode)}
              {detail ? <span className="font-normal text-muted-foreground"> · {detail}</span> : null}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export function FactsCard({ facts, factsCod, territoryCod, loading }: { facts: FactItem[] | undefined; factsCod: number; territoryCod: number; loading?: boolean }) {
  const territories = useTerritories()
  const name = territories.data?.find((item) => item.cod === factsCod)?.local ?? NAMES[factsCod] ?? "Brasil"
  const note = territoryCod !== factsCod ? " (fatos disponíveis para Brasil e regiões)" : ""
  const shown = visibleFacts(facts)
  return (
    <section data-card className="rounded-lg border border-border p-4" aria-label="Fatos">
      <h2 className="text-sm font-medium">Fatos</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Fatos de: {name}
        {note}
      </p>
      {loading ? <p className="mt-3 text-sm">Carregando fatos…</p> : null}
      {shown.length ? (
        <div className="mt-3">
          <FactList facts={shown} />
        </div>
      ) : null}
    </section>
  )
}
