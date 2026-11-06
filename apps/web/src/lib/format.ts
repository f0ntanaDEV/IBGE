export type NumberFormat = "integer" | "number" | "decimal" | "percent" | "permil" | "years"
export type MetricKind = "count" | "percent" | "permil" | "years" | "rate" | "index" | "delta" | "year" | "raw"
export type MetricMeta = { key: string; kind: MetricKind; unitSimple?: string }

const integer = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 })
const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 })
const decimal = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const onePlace = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const percent = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 })
const dateFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" })
const percent0 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 })
const compactLoose = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 })
const compactTight = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 0 })

function normalize(text: string) {
  return text.replace(/[\u00a0\u202f]/g, " ")
}

export function formatCompact(v: number): string {
  if (!Number.isFinite(v)) return "—"
  const sign = v < 0 ? "-" : ""
  const abs = Math.abs(v)
  if (abs < 1000) return sign + normalize(integer.format(abs))
  const parts = compactLoose.formatToParts(abs)
  const digits = (parts.find((part) => part.type === "integer")?.value ?? "").replace(/\D/g, "")
  const text = digits.length >= 3 ? compactTight.format(abs) : compactLoose.format(abs)
  return sign + normalize(text)
}

function formatFull(v: number, metric: MetricMeta) {
  if (metric.kind === "percent") return normalize(percent.format(v))
  if (metric.kind === "permil") return `${normalize(decimal.format(v))} por mil`
  if (metric.kind === "years") {
    const text = Number.isInteger(v) ? integer.format(v) : decimal.format(v)
    return `${normalize(text)} anos`
  }
  if (metric.kind === "delta") return normalize(onePlace.format(Math.abs(v)))
  if (metric.kind === "year") return String(Math.trunc(v))
  if (metric.kind === "rate" || metric.kind === "index") return normalize(decimal.format(v))
  if (metric.kind === "raw") return normalize(number.format(v))
  return normalize(integer.format(v))
}

export function formatAxisValue(value: number, metric: MetricMeta, digits: 0 | 1 = 0): string {
  if (!Number.isFinite(value)) return "—"
  if (metric.kind === "percent") return `${percent0.format(value * 100)}%`
  if (metric.kind === "year") return String(Math.trunc(value))
  if (metric.kind === "count") return digits === 1 ? normalize(compactLoose.format(value)) : formatCompact(value)
  if (metric.kind === "years" || metric.kind === "rate" || metric.kind === "permil" || metric.kind === "index" || metric.kind === "raw") {
    return normalize(onePlace.format(value))
  }
  return formatCompact(value)
}

export function formatAgeBand(raw: string | number) {
  const text = String(raw).trim()
  const range = text.match(/(\d+)\s*[-–a]\s*(\d+)/)
  if (range) return `${range[1]}–${range[2]}`
  return text
}

export function formatValue(v: number | null, metric: MetricMeta): string {
  if (v == null || Number.isNaN(v)) return "—"
  return formatFull(v, metric)
}

export function metricFromFormat(format: NumberFormat, key = "valor"): MetricMeta {
  if (format === "percent") return { key, kind: "percent" }
  if (format === "permil") return { key, kind: "permil" }
  if (format === "years") return { key, kind: "years" }
  if (format === "decimal") return { key, kind: "rate" }
  if (format === "number") return { key, kind: "raw" }
  return { key, kind: "count" }
}

export function formatBy(format: NumberFormat, value: number | null, key = "valor") {
  return formatValue(value, metricFromFormat(format, key))
}

export function formatLoose(value: number) {
  if (!Number.isFinite(value)) return "—"
  return formatValue(value, { key: "loose", kind: Number.isInteger(value) ? "count" : "raw" })
}

export function formatDate(value: string | Date) {
  if (value instanceof Date) return dateFmt.format(value)
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (match) return dateFmt.format(new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
  const brazilian = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(value)
  if (brazilian) return dateFmt.format(new Date(Number(brazilian[3]), Number(brazilian[2]) - 1, Number(brazilian[1])))
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "—"
  return dateFmt.format(parsed)
}
