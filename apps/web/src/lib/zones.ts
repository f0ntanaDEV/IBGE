import { KPI_RULES, type KpiRule } from "@/content/kpi-rules"

const METRICS = new Set(["tft", "tmi_t", "ie60", "p_60", "rdt65", "id_med", "nqx_0", "lx_80", "e60", "p_15_64_t", "p_65_mais_t", "p_80_mais_t"])

export type Zone = { label: string; from: number | null; to: number | null; status: "good" | "warn" | "bad" }

const LABEL = { good: "Zona Segura", warn: "Zona de Atenção", bad: "Zona Crítica" } as const

function inside(value: number, band: KpiRule["good"]) {
  if (band.gt != null && !(value > band.gt)) return false
  if (band.gte != null && !(value >= band.gte)) return false
  if (band.lt != null && !(value < band.lt)) return false
  if (band.lte != null && !(value <= band.lte)) return false
  return true
}

function statusAt(rule: KpiRule, value: number): Zone["status"] {
  if (inside(value, rule.good)) return "good"
  if (inside(value, rule.warn)) return "warn"
  return "bad"
}

/** Faixas de alerta a partir da regra de valor. Limites abertos ficam nulos. */
export function zonesFor(metricId: string): Zone[] | null {
  if (!METRICS.has(metricId)) return null
  const rule = KPI_RULES.find((item) => item.metricId === metricId && item.basis === "value")
  if (!rule) return null
  const cuts = new Set<number>()
  for (const band of [rule.good, rule.warn]) {
    for (const value of [band.gt, band.gte, band.lt, band.lte]) {
      if (value != null) cuts.add(value)
    }
  }
  const points = [...cuts].sort((a, b) => a - b)
  if (!points.length) return null
  const edges: (number | null)[] = [null, ...points, null]
  const zones: Zone[] = []
  for (let index = 0; index < edges.length - 1; index += 1) {
    const from = edges[index]
    const to = edges[index + 1]
    const probe = from == null ? (to ?? 0) - 1 : to == null ? from + 1 : (from + to) / 2
    const status = statusAt(rule, probe)
    const previous = zones[zones.length - 1]
    if (previous && previous.status === status) previous.to = to
    else zones.push({ label: LABEL[status], from, to, status })
  }
  return zones
}
