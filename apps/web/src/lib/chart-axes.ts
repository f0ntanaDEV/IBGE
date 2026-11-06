import { formatAxisValue, type MetricMeta } from "@/lib/format"

export const YEAR_TICKS = [2000, 2010, 2020, 2030, 2040, 2050, 2060, 2070]
export const YEAR_TICKS_MOBILE = [2000, 2020, 2040, 2060, 2070]

function niceNum(range: number, round: boolean) {
  const abs = Math.abs(range) || 1
  const exp = Math.floor(Math.log10(abs))
  const fraction = abs / 10 ** exp
  const nice = round
    ? fraction < 1.5
      ? 1
      : fraction < 3
        ? 2
        : fraction < 7
          ? 5
          : 10
    : fraction <= 1
      ? 1
      : fraction <= 2
        ? 2
        : fraction <= 5
          ? 5
          : 10
  return nice * 10 ** exp
}

export function niceDomain(values: number[], pad = 0.05): [number, number] {
  const nums = values.filter((value) => Number.isFinite(value))
  if (nums.length === 0) return [0, 1]
  const rawMin = Math.min(...nums)
  const rawMax = Math.max(...nums)
  const span = rawMax - rawMin || Math.abs(rawMax) || 1
  const min = rawMin - span * pad
  const max = rawMax + span * pad
  const step = niceNum(max - min, false)
  const start = Math.floor(min / step) * step
  const end = Math.ceil(max / step) * step
  return [Number(start.toPrecision(12)), Number(end.toPrecision(12))]
}

export function decadeDomain(values: number[]): [number, number] {
  const nums = values.filter((value) => Number.isFinite(value))
  if (nums.length === 0) return [60, 90]
  const start = Math.floor(Math.min(...nums) / 10) * 10
  const end = Math.ceil(Math.max(...nums) / 10) * 10
  return [start, end > start ? end : start + 10]
}

export function decadeTicks([min, max]: [number, number]) {
  const ticks: number[] = []
  for (let value = min; value <= max; value += 10) ticks.push(value)
  return ticks
}

export function niceTicks([min, max]: [number, number], count = 5): number[] {
  if (!(max > min)) return [min]
  const step = niceNum((max - min) / Math.max(1, count - 1), true)
  const start = Math.ceil((min - step * 1e-6) / step) * step
  const ticks: number[] = []
  for (let value = start; value <= max + step * 1e-6; value += step) {
    ticks.push(Number(value.toPrecision(12)))
    if (ticks.length > 8) break
  }
  return ticks.length > 0 ? ticks : [min, max]
}

export function formatAxis(value: number, metric: MetricMeta, digits: 0 | 1 = 0) {
  return formatAxisValue(value, metric, digits)
}

export function yAxisWidth(ticks: number[], fmt: (value: number) => string): number {
  const labels = ticks.map(fmt)
  const fallback = 12 + Math.max(0, ...labels.map((label) => label.length)) * 7
  if (typeof document === "undefined") return fallback
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) return fallback
  ctx.font = getComputedStyle(document.body).font || "12px sans-serif"
  const width = Math.max(0, ...labels.map((label) => ctx.measureText(label).width))
  return Math.ceil(width + 16)
}

export function labelSide(x: number, domain: [number, number]): "left" | "right" {
  const mid = (domain[0] + domain[1]) / 2
  return x > mid ? "left" : "right"
}
