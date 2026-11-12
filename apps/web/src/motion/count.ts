import { metricById } from "@/content/metricas"
import { formatCompact, formatValue, type MetricMeta, type Mode, type NumberFormat } from "@/lib/format"

export function countUpStart(value: unknown): number | null {
  if (typeof value === "string") return null
  if (typeof value !== "number" || !Number.isFinite(value)) return null
  return 0
}

export function decimalsOf(value: number, metric?: { casas?: number }): number {
  if (metric && metric.casas != null && Number.isFinite(metric.casas)) return metric.casas
  if (Number.isInteger(value)) return 0
  const text = String(value)
  const index = text.indexOf(".")
  return index < 0 ? 0 : text.length - index - 1
}

export function roundPlaces(value: number, places: number) {
  const scale = 10 ** places
  return Math.round(value * scale) / scale
}

const memory = new Map<string, number>()

export function resetCountMemory() {
  memory.clear()
}

export function countedFrom(key: string, value: number) {
  if (!memory.has(key)) return countUpStart(value)
  return memory.get(key) ?? value
}

export function commitCount(key: string, value: number) {
  memory.set(key, value)
}

export function metricFor(metricKey: string | undefined, format: NumberFormat | undefined, value: number): MetricMeta {
  const found = metricKey ? metricById(metricKey) : undefined
  if (found) return { key: found.id, kind: found.kind }
  if (format === "percent") return { key: metricKey ?? "kpi", kind: "percent" }
  if (format === "integer") return { key: metricKey ?? "kpi", kind: "count" }
  if (format === "permil") return { key: metricKey ?? "kpi", kind: "permil" }
  if (format === "years") return { key: metricKey ?? "kpi", kind: "years" }
  if (format === "number") return { key: metricKey ?? "kpi", kind: "raw" }
  if (!Number.isInteger(value)) return { key: metricKey ?? "kpi", kind: "rate" }
  return { key: metricKey ?? "kpi", kind: "count" }
}

export function formatCount(value: number, metric: MetricMeta, mode: Mode, compact = false) {
  if (compact) return formatCompact(value)
  return formatValue(value, metric, mode)
}
