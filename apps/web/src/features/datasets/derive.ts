import type { PyramidRow } from "@/features/datasets/api"
import { formatValue } from "@/lib/format"
export const YEAR_MIN = 2000
export const YEAR_MAX = 2070

export function calendarYear() {
  return new Date().getFullYear()
}

export function clampYear(value: number) {
  if (!Number.isFinite(value)) return Math.min(YEAR_MAX, Math.max(YEAR_MIN, calendarYear()))
  return Math.min(YEAR_MAX, Math.max(YEAR_MIN, value))
}

export type SexKind = "t" | "h" | "m"

export function sexKind(sexo: string): SexKind {
  const text = sexo.trim().toLowerCase()
  if (text.startsWith("hom")) return "h"
  if (text.startsWith("mul")) return "m"
  return "t"
}

export function sexColumn(base: string, sexo: string) {
  const kind = sexKind(sexo)
  if (base.endsWith("_t")) return `${base.slice(0, -2)}_${kind}`
  return base
}

export function num(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function countOf(row: PyramidRow, sexo: string) {
  const kind = sexKind(sexo)
  if (kind === "h") return Number(row.homens) || 0
  if (kind === "m") return Number(row.mulheres) || 0
  return (Number(row.homens) || 0) + (Number(row.mulheres) || 0)
}

export function startAge(faixa: string | number) {
  if (typeof faixa === "number") return faixa
  const match = /^(\d+)/.exec(String(faixa))
  return match ? Number(match[1]) : Number.NaN
}

export type PyramidBar = {
  faixa: string | number
  homens: number
  mulheres: number
} & Record<string, number | string>

export function toPyramidChart(rows: PyramidRow[], outlines: { id: string; rows: PyramidRow[] }[] = []): PyramidBar[] {
  const outlinesById = outlines.map((item) => ({
    id: item.id,
    byFaixa: new Map(item.rows.map((row) => [String(row.faixa), row])),
  }))
  return rows.map((row) => {
    const bar: PyramidBar = {
      faixa: row.faixa,
      homens: -Math.abs(Number(row.homens) || 0),
      mulheres: Math.abs(Number(row.mulheres) || 0),
    }
    for (const outline of outlinesById) {
      const other = outline.byFaixa.get(String(row.faixa))
      bar[`homens_${outline.id}`] = -Math.abs(Number(other?.homens) || 0)
      bar[`mulheres_${outline.id}`] = Math.abs(Number(other?.mulheres) || 0)
    }
    return bar
  })
}

export function rowsForYear(rows: PyramidRow[], year: number) {
  return rows.filter((row) => Number(row.ano) === year)
}

const BROAD_BANDS: [number, number, string][] = [
  [0, 14, "0–14"],
  [15, 29, "15–29"],
  [30, 44, "30–44"],
  [45, 59, "45–59"],
  [60, 74, "60–74"],
  [75, 200, "75+"],
]

export function broadBands(rows: PyramidRow[]): PyramidRow[] {
  return BROAD_BANDS.map(([min, max, faixa]) => {
    const slice = rows.filter((row) => {
      const age = startAge(row.faixa)
      return age >= min && age <= max
    })
    return {
      ano: rows[0]?.ano,
      faixa,
      homens: slice.reduce((sum, row) => sum + (Number(row.homens) || 0), 0),
      mulheres: slice.reduce((sum, row) => sum + (Number(row.mulheres) || 0), 0),
    }
  })
}

export function populationSeries(rows: PyramidRow[], sexo: string) {
  const byYear = new Map<number, number>()
  for (const row of rows) {
    const year = Number(row.ano)
    if (!Number.isFinite(year)) continue
    byYear.set(year, (byYear.get(year) ?? 0) + countOf(row, sexo))
  }
  return [...byYear.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([ano, populacao]) => ({ ano, populacao }))
}

export function medianAge(pairs: { age: number; pop: number }[]) {
  const total = pairs.reduce((sum, item) => sum + item.pop, 0)
  if (total <= 0) return null
  const ordered = [...pairs].sort((a, b) => a.age - b.age)
  let acc = 0
  const half = total / 2
  for (const item of ordered) {
    acc += item.pop
    if (acc >= half) return item.age
  }
  return ordered[ordered.length - 1]?.age ?? null
}

export function ageKpis(rows: PyramidRow[], sexo: string) {
  const pairs = rows
    .map((row) => ({ age: startAge(row.faixa), pop: countOf(row, sexo) }))
    .filter((item) => Number.isFinite(item.age))
  const total = pairs.reduce((sum, item) => sum + item.pop, 0)
  const young = pairs.filter((item) => item.age <= 14).reduce((sum, item) => sum + item.pop, 0)
  const old = pairs.filter((item) => item.age >= 60).reduce((sum, item) => sum + item.pop, 0)
  return {
    populacao: total || null,
    p_0_14: total ? young / total : null,
    p_60: total ? old / total : null,
    idade_mediana: medianAge(pairs),
  }
}

export function groupKpis(rows: PyramidRow[], sexo: string) {
  const items = rows.map((row) => ({
    label: String(row.faixa),
    start: startAge(row.faixa),
    pop: countOf(row, sexo),
  }))
  const best = items.reduce<{ label: string; pop: number } | null>((winner, item) => {
    if (!winner || item.pop > winner.pop) return { label: item.label, pop: item.pop }
    return winner
  }, null)
  const young = items.filter((item) => item.start === 0).reduce((sum, item) => sum + item.pop, 0)
  const old = items.filter((item) => item.start >= 80).reduce((sum, item) => sum + item.pop, 0)
  return {
    maior_grupo: best?.label ?? null,
    maior_inicio: best ? startAge(best.label) : null,
    pop_0_4: young || null,
    pop_80: old || null,
    razao_80_0_4: young ? old / young : null,
  }
}

export function compositionSeries(rows: PyramidRow[], sexo: string) {
  const byYear = new Map<number, { jovem: number; ativa: number; idosa: number }>()
  for (const row of rows) {
    const year = Number(row.ano)
    const start = startAge(row.faixa)
    if (!Number.isFinite(year) || !Number.isFinite(start)) continue
    const bucket = byYear.get(year) ?? { jovem: 0, ativa: 0, idosa: 0 }
    const pop = countOf(row, sexo)
    if (start <= 14) bucket.jovem += pop
    else if (start <= 59) bucket.ativa += pop
    else bucket.idosa += pop
    byYear.set(year, bucket)
  }
  return [...byYear.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([ano, bucket]) => {
      const total = bucket.jovem + bucket.ativa + bucket.idosa
      return {
        ano,
        jovem: total ? bucket.jovem / total : 0,
        ativa: total ? bucket.ativa / total : 0,
        idosa: total ? bucket.idosa / total : 0,
      }
    })
}

export function crossingYear(points: { ano: number; a: number | null; b: number | null }[]) {
  const ordered = [...points].sort((left, right) => left.ano - right.ano)
  for (const point of ordered) {
    if (point.a != null && point.b != null && point.b > point.a) return point.ano
  }
  return null
}

export function peakPoint(points: { ano: number; valor: number | null }[]) {
  let best: { ano: number; valor: number } | null = null
  for (const point of points) {
    if (point.valor == null) continue
    if (!best || point.valor > best.valor) best = { ano: point.ano, valor: point.valor }
  }
  return best
}

export function deltaValue(current: number | null, previous: number | null, _format?: string) {
  if (current == null || previous == null || previous === 0) return null
  return (current / previous - 1) * 100
}

export function deltaSuffix(format: string) {
  if (format === "int") return "%"
  if (format === "percent") return " p.p."
  if (format === "years") return " anos"
  return ""
}

export function formatClaim(value: number | string | null) {
  if (value == null || value === "") return "—"
  if (typeof value !== "number") return String(value)
  if (Number.isInteger(value) && value >= 1900 && value <= 2100) return String(value)
  const kind = Math.abs(value) >= 1000 ? "count" : "raw"
  return formatValue(value, { key: "claim", kind })
}

export function isOutlier(value: unknown) {
  return value === true || value === 1 || value === "true" || value === "True"
}
