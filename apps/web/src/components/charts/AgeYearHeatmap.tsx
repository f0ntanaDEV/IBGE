import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react"
import { calendarYear } from "@/features/datasets/derive"
import { useChartTheme } from "@/hooks/useChartTheme"
import { formatAxisValue } from "@/lib/format"

export type HeatCell = { idade: number; ano: number; valor: number }

export const HEAT_MARGIN = { left: 44, top: 16, right: 16, bottom: 28 }
export const HEAT_YEAR_MIN = 2000
export const HEAT_YEAR_MAX = 2070
export const HEAT_AGE_MAX = 89
const YEAR_TICKS = [2000, 2010, 2020, 2030, 2040, 2050, 2060, 2070]
const AGE_TICKS = [0, 10, 20, 30, 40, 50, 60, 70, 80]
const FALLBACK_STOPS = ["hsl(215 16% 88%)", "hsl(215 18% 74%)", "hsl(215 20% 60%)", "hsl(215 22% 46%)", "hsl(215 24% 32%)"]
const POP = { key: "populacao", kind: "count" } as const

export function referenceYear(years: number[], today = new Date().getFullYear()) {
  if (years.includes(today)) return today
  return years.length ? Math.max(...years) : today
}

export function plotBox(width: number, height: number) {
  return {
    x: HEAT_MARGIN.left,
    y: HEAT_MARGIN.top,
    w: Math.max(1, width - HEAT_MARGIN.left - HEAT_MARGIN.right),
    h: Math.max(1, height - HEAT_MARGIN.top - HEAT_MARGIN.bottom),
  }
}

export function xOf(year: number, plotW: number) {
  return ((year - HEAT_YEAR_MIN) / (HEAT_YEAR_MAX - HEAT_YEAR_MIN)) * plotW
}

export function yOf(age: number, plotH: number) {
  return plotH - (age / HEAT_AGE_MAX) * plotH
}

export function cellAt(x: number, y: number, plotW: number, plotH: number) {
  if (plotW <= 0 || plotH <= 0 || x < 0 || y < 0 || x >= plotW || y >= plotH) return null
  const ano = Math.min(HEAT_YEAR_MAX, Math.max(HEAT_YEAR_MIN, Math.round(HEAT_YEAR_MIN + (x / plotW) * (HEAT_YEAR_MAX - HEAT_YEAR_MIN))))
  const idade = Math.min(HEAT_AGE_MAX, Math.max(0, Math.floor(((plotH - y) / plotH) * HEAT_AGE_MAX)))
  return { idade, ano }
}

export function axisLayout(width: number, height: number) {
  const plot = plotBox(width, height)
  return {
    plot,
    years: YEAR_TICKS.map((year, index) => ({
      year,
      x: plot.x + xOf(year, plot.w),
      y: plot.y + plot.h + 16,
      anchor: (index === 0 ? "start" : index === YEAR_TICKS.length - 1 ? "end" : "middle") as "start" | "end" | "middle",
    })),
    ages: AGE_TICKS.map((age) => ({
      age,
      x: HEAT_MARGIN.left - 6,
      y: plot.y + yOf(age, plot.h),
    })),
    title: { x: 12, y: plot.y + plot.h / 2 },
  }
}

function parseHsl(input: string): [number, number, number] | null {
  const match = input.match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/)
  if (!match) return null
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sat = s / 100
  const lig = l / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = sat * Math.min(lig, 1 - lig)
  const f = (n: number) => lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
}

export function mixSequential(stops: string[], t: number): [number, number, number] {
  const colors = stops.map(parseHsl).filter((item): item is [number, number, number] => item != null)
  if (colors.length === 0) return [120, 140, 160]
  const clamped = Math.min(1, Math.max(0, t))
  const scaled = clamped * (colors.length - 1)
  const index = Math.min(colors.length - 1, Math.floor(scaled))
  const next = Math.min(colors.length - 1, index + 1)
  const fraction = scaled - index
  const from = hslToRgb(...colors[index])
  const to = hslToRgb(...colors[next])
  return from.map((channel, i) => Math.round(channel + (to[i] - channel) * fraction)) as [number, number, number]
}

export function paintMatrix(
  data: Uint8ClampedArray,
  width: number,
  years: number[],
  ages: number[],
  lookup: Map<string, number>,
  min: number,
  max: number,
  stops: string[],
  discrete = false,
) {
  const span = max - min || 1
  ages.forEach((age, ageIndex) => {
    if (age > HEAT_AGE_MAX) return
    years.forEach((year, yearIndex) => {
      const value = lookup.get(`${age}:${year}`)
      if (value == null) return
      const t = (value - min) / span
      const [r, g, b] = discrete ? parseHsl(stops[Math.min(stops.length - 1, Math.floor(t * stops.length))] ?? stops[0]) ?? [0, 0, 0] : mixSequential(stops, t)
      const row = ages.length - 1 - ageIndex
      const offset = (row * width + yearIndex) * 4
      data[offset] = r
      data[offset + 1] = g
      data[offset + 2] = b
      data[offset + 3] = 255
    })
  })
}

function raster(width: number, height: number) {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height)
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  return canvas
}

function compactPeople(value: number) {
  return formatAxisValue(value, POP, 1)
}

export function GradientLegend({ min, max, stops, title }: { min: number; max: number; stops: string[]; title: string }) {
  const mid = min + (max - min) / 2
  return (
    <div className="mt-1" style={{ marginLeft: HEAT_MARGIN.left, marginRight: HEAT_MARGIN.right }}>
      <p className="text-xs text-muted-foreground">{title}</p>
      <div className="mt-1 h-2 rounded-sm" style={{ background: `linear-gradient(90deg, ${stops.join(", ")})` }} />
      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground tabular-nums">
        <span>{compactPeople(min)}</span>
        <span>{compactPeople(mid)}</span>
        <span>{compactPeople(max)}</span>
      </div>
    </div>
  )
}

export function AgeYearHeatmap({
  cells,
  summary,
  onSelectAge,
}: {
  cells: HeatCell[]
  summary: string
  highlightAges?: number[]
  onSelectAge?: (idade: number) => void
}) {
  const { sequential, highContrast } = useChartTheme()
  const stops = sequential.filter(Boolean)
  const palette = stops.length ? stops : FALLBACK_STOPS
  const host = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [box, setBox] = useState({ w: 640, h: 280 })
  const [tip, setTip] = useState<{ idade: number; ano: number; valor: number; x: number; y: number } | null>(null)
  const years = useMemo(() => Array.from({ length: HEAT_YEAR_MAX - HEAT_YEAR_MIN + 1 }, (_, index) => HEAT_YEAR_MIN + index), [])
  const ages = useMemo(() => Array.from({ length: HEAT_AGE_MAX + 1 }, (_, index) => index), [])
  const lookup = useMemo(
    () => new Map(cells.filter((cell) => cell.idade <= HEAT_AGE_MAX).map((cell) => [`${cell.idade}:${cell.ano}`, cell.valor])),
    [cells],
  )
  const values = [...lookup.values()]
  const min = values.length ? Math.min(...values) : 0
  const max = values.length ? Math.max(...values) : 1
  const layout = axisLayout(box.w, box.h)
  const today = calendarYear()

  useEffect(() => {
    const node = host.current
    if (!node) return
    const read = () => {
      const rect = node.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) setBox({ w: Math.floor(rect.width), h: Math.floor(rect.height) })
    }
    read()
    const observer = new ResizeObserver(read)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const width = layout.plot.w
    const height = layout.plot.h
    const dpr = window.devicePixelRatio || 1
    const off = raster(years.length, ages.length)
    const offCtx = off.getContext("2d")
    if (!offCtx) return
    const image = offCtx.createImageData(years.length, ages.length)
    paintMatrix(image.data, years.length, years, ages, lookup, min, max, palette, highContrast)
    offCtx.putImageData(image, 0, 0)
    const bw = Math.max(1, Math.round(width * dpr))
    const bh = Math.max(1, Math.round(height * dpr))
    canvas.width = bw
    canvas.height = bh
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, bw, bh)
    ctx.drawImage(off, 0, 0, bw, bh)
  }, [ages, highContrast, layout.plot.h, layout.plot.w, lookup, max, min, palette, years])

  function hit(event: MouseEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const found = cellAt(x, y, rect.width, rect.height)
    if (!found) return null
    const valor = lookup.get(`${found.idade}:${found.ano}`)
    if (valor == null) return null
    return { ...found, valor, x: event.clientX - (host.current?.getBoundingClientRect().left ?? 0), y: event.clientY - (host.current?.getBoundingClientRect().top ?? 0) }
  }

  const tipLeft = tip ? Math.min(Math.max(8, tip.x + 8), box.w - 168) : 0
  const tipTop = tip ? Math.min(Math.max(8, tip.y + 8), box.h - 28) : 0

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={host} className="relative min-h-0 flex-1">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={summary}
          className="absolute"
          style={{ left: HEAT_MARGIN.left, top: HEAT_MARGIN.top, width: layout.plot.w, height: layout.plot.h }}
          onMouseMove={(event) => setTip(hit(event))}
          onMouseLeave={() => setTip(null)}
          onClick={(event) => {
            const found = hit(event)
            if (found) onSelectAge?.(found.idade)
          }}
        />
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          <text
            x={layout.title.x}
            y={layout.title.y}
            fill="currentColor"
            fontSize="11"
            textAnchor="middle"
            transform={`rotate(-90 ${layout.title.x} ${layout.title.y})`}
          >
            Idade
          </text>
          {layout.ages.map((tick) => (
            <text key={tick.age} data-age={tick.age} x={tick.x} y={tick.y} fill="currentColor" fontSize="11" textAnchor="end" dominantBaseline="middle">
              {tick.age}
            </text>
          ))}
          {layout.years.map((tick) => (
            <text key={tick.year} data-year={tick.year} x={tick.x} y={tick.y} fill="currentColor" fontSize="11" textAnchor={tick.anchor} dominantBaseline="hanging">
              {tick.year}
            </text>
          ))}
          {today >= HEAT_YEAR_MIN && today <= HEAT_YEAR_MAX ? (
            <g>
              <line
                x1={layout.plot.x + xOf(today, layout.plot.w)}
                x2={layout.plot.x + xOf(today, layout.plot.w)}
                y1={layout.plot.y}
                y2={layout.plot.y + layout.plot.h}
                stroke="currentColor"
                strokeOpacity="0.45"
              />
              <text
                x={layout.plot.x + xOf(today, layout.plot.w)}
                y={4}
                fill="currentColor"
                fontSize="11"
                textAnchor="middle"
              >
                {today}
              </text>
            </g>
          ) : null}
        </svg>
        {tip ? (
          <div
            className="pointer-events-none absolute z-10 max-w-40 rounded-md border border-border bg-popover px-2 py-1 text-xs"
            style={{ left: tipLeft, top: tipTop }}
          >
            Idade {tip.idade} · {tip.ano} · {compactPeople(tip.valor)} pessoas
          </div>
        ) : null}
      </div>
      <GradientLegend min={min} max={max} stops={palette} title="Pessoas por idade" />
      <p className="mt-1 text-xs text-muted-foreground" style={{ marginLeft: HEAT_MARGIN.left, marginRight: HEAT_MARGIN.right }}>
        Idades de 0 a 89 anos. O grupo 90 ou mais não é exibido por ser um grupo aberto.
      </p>
    </div>
  )
}
