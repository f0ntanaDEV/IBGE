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

export function FactsCard({ facts, factsCod, territoryCod, loading }: { facts: FactItem[] | undefined; factsCod: number; territoryCod: number; loading?: boolean }) {
  const mode = useMode()
  const territories = useTerritories()
  const name = territories.data?.find((item) => item.cod === factsCod)?.local ?? NAMES[factsCod] ?? "Brasil"
  const note = territoryCod !== factsCod ? " (fatos disponíveis para Brasil e regiões)" : ""
  return (
    <section data-card className="rounded-lg border border-border p-4" aria-label="Fatos">
      <h2 className="text-sm font-medium">Fatos</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Fatos de: {name}
        {note}
      </p>
      {loading ? <p className="mt-3 text-sm">Carregando fatos…</p> : null}
      <ul className="mt-3 grid gap-3 xl:grid-cols-2">
        {(facts ?? []).map((fact) => (
          <li key={fact.id} className="text-sm">
            <p className="font-medium">{fact.label}</p>
            <p className="tabular-nums">{textValue(fact, mode)}</p>
            {detailText(fact, mode) ? <p className="text-muted-foreground">{detailText(fact, mode)}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  )
}
