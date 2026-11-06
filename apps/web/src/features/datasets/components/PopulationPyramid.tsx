import { memo, useEffect, useMemo, useState } from "react"
import type { PyramidRow } from "@/features/datasets/api"
import { YEAR_MAX, YEAR_MIN, calendarYear, countOf, startAge, toPyramidChart } from "@/features/datasets/derive"
import { useChartTheme } from "@/hooks/useChartTheme"
import { useFormatter } from "@/hooks/useFormatter"
import { formatAgeBand } from "@/lib/format"

type Outline = { id: string; label: string; rows: PyramidRow[] }

type PopulationPyramidProps = {
  rows: PyramidRow[]
  outlines?: Outline[]
  granularity: "idade" | "quinquenal"
  year: number
  onYear: (year: number) => void
  animate?: boolean
  summary: string
}

const VB_W = 720
const VB_H = 420
const PLAY_STEP_MS = 140

function PopulationPyramidView({ rows, outlines = [], granularity, year, onYear, animate = false, summary }: PopulationPyramidProps) {
  const { colors } = useChartTheme()
  const simple = false
  const formatCount = useFormatter({ key: "populacao", kind: "count" })
  const [playing, setPlaying] = useState(false)
  const [hover, setHover] = useState<number | null>(null)
  const data = useMemo(() => toPyramidChart(rows, outlines), [rows, outlines])
  const bars = useMemo(() => [...data].sort((a, b) => startAge(a.faixa) - startAge(b.faixa)), [data])
  const outlineIds = outlines.map((item) => item.id)
  const max = useMemo(() => {
    const values = bars.flatMap((row) =>
      Object.values(row).filter((value): value is number => typeof value === "number").map((value) => Math.abs(value)),
    )
    return Math.max(1, ...values)
  }, [bars])
  const pad = { l: granularity === "idade" ? 44 : 64, r: 12, t: 8, b: 28 }
  const plotW = VB_W - pad.l - pad.r
  const mid = pad.l + plotW / 2
  const maxBar = plotW / 2
  const slot = bars.length ? (VB_H - pad.t - pad.b) / bars.length : 0
  const men = colors[0] || "var(--chart-1)"
  const women = colors[1] || "var(--chart-2)"

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      if (year >= YEAR_MAX) {
        setPlaying(false)
        return
      }
      onYear(year + 1)
    }, PLAY_STEP_MS)
    return () => window.clearInterval(timer)
  }, [playing, onYear, year])

  const total = rows.reduce((sum, row) => sum + countOf(row, "Ambos"), 0)
  const hovered = hover == null ? null : bars[hover]

  return (
    <div className="flex h-full min-h-0 flex-col gap-3" role="img" aria-label={summary || `Pirâmide de ${formatCount(total)} pessoas em ${year}`}>
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 bg-card py-1 md:static">
        <label className="flex min-w-48 flex-1 items-center gap-2 text-sm">
          Ano {year}
          {year > calendarYear() ? " (projetado)" : ""}
          <input
            type="range"
            min={YEAR_MIN}
            max={YEAR_MAX}
            value={year}
            aria-valuetext={String(year)}
            onChange={(event) => {
              setPlaying(false)
              onYear(Number(event.target.value))
            }}
            className="w-full"
          />
        </label>
        {animate ? (
          <button
            type="button"
            className="h-8 rounded-md border border-border px-3 text-xs"
            aria-pressed={playing}
            onClick={() => {
              if (playing) {
                setPlaying(false)
                return
              }
              onYear(YEAR_MIN)
              setPlaying(true)
            }}
          >
            {playing ? "Pausar" : "▶ Reproduzir"}
          </button>
        ) : null}
      </div>
      <div className="relative h-full min-h-0 w-full flex-1">
        {playing ? (
          <p aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center text-7xl font-medium text-foreground/10 tabular-nums">
            {year}
          </p>
        ) : null}
        {hovered ? (
          <div className="absolute top-2 right-2 z-10 grid gap-1 rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground">
            <div className="font-medium">{formatAgeBand(hovered.faixa)}</div>
            <div>Homens {formatCount(Math.abs(hovered.homens))}</div>
            <div>Mulheres {formatCount(Math.abs(hovered.mulheres))}</div>
          </div>
        ) : null}
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="relative h-full w-full">
          {!simple
            ? [-1, -0.5, 0, 0.5, 1].map((tick) => (
                <line
                  key={tick}
                  x1={mid + tick * maxBar}
                  x2={mid + tick * maxBar}
                  y1={pad.t}
                  y2={VB_H - pad.b}
                  stroke="hsl(var(--border))"
                />
              ))
            : null}
          {[-1, -0.5, 0, 0.5, 1].map((tick) => (
            <text
              key={`tick-${tick}`}
              x={mid + tick * maxBar}
              y={VB_H - 8}
              textAnchor="middle"
              fill="hsl(var(--muted-foreground))"
              fontSize={11}
            >
              {formatCount(Math.abs(tick) * max)}
            </text>
          ))}
          {bars.map((row, index) => {
            const y = VB_H - pad.b - (index + 1) * slot + slot * 0.15
            const height = Math.max(1, slot * 0.7)
            const showAge = granularity !== "idade" || startAge(row.faixa) % 10 === 0
            return (
              <g key={String(row.faixa)} onPointerEnter={() => setHover(index)} onPointerLeave={() => setHover(null)}>
                {showAge ? (
                  <text x={pad.l - 6} y={y + height / 2} textAnchor="end" dominantBaseline="middle" fill="hsl(var(--muted-foreground))" fontSize={11}>
                    {formatAgeBand(row.faixa)}
                  </text>
                ) : null}
                {outlineIds.map((id) => (
                  <BarPair
                    key={id}
                    y={y}
                    height={height}
                    mid={mid}
                    maxBar={maxBar}
                    men={Math.abs(Number(row[`homens_${id}`]) || 0) / max}
                    women={Math.abs(Number(row[`mulheres_${id}`]) || 0) / max}
                    menColor={men}
                    womenColor={women}
                    outline
                    dashed={id === "futuro"}
                  />
                ))}
                <BarPair
                  y={y}
                  height={height}
                  mid={mid}
                  maxBar={maxBar}
                  men={Math.abs(row.homens) / max}
                  women={Math.abs(row.mulheres) / max}
                  menColor={men}
                  womenColor={women}
                />
              </g>
            )
          })}
        </svg>
      </div>
      {simple ? <p className="text-sm">Homens à esquerda · Mulheres à direita</p> : null}
    </div>
  )
}

function BarPair({
  y,
  height,
  mid,
  maxBar,
  men,
  women,
  menColor,
  womenColor,
  outline = false,
  dashed = false,
}: {
  y: number
  height: number
  mid: number
  maxBar: number
  men: number
  women: number
  menColor: string
  womenColor: string
  outline?: boolean
  dashed?: boolean
}) {
  return (
    <>
      <PyramidBar x={mid - maxBar} y={y} width={maxBar} height={height} ratio={men} origin="right center" color={menColor} outline={outline} dashed={dashed} />
      <PyramidBar x={mid} y={y} width={maxBar} height={height} ratio={women} origin="left center" color={womenColor} outline={outline} dashed={dashed} />
    </>
  )
}

function PyramidBar({
  x,
  y,
  width,
  height,
  ratio,
  origin,
  color,
  outline,
  dashed,
}: {
  x: number
  y: number
  width: number
  height: number
  ratio: number
  origin: string
  color: string
  outline: boolean
  dashed: boolean
}) {
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={outline ? "transparent" : color}
      stroke={outline ? color : "none"}
      strokeWidth={outline ? 1.25 : 0}
      strokeDasharray={dashed ? "4 3" : undefined}
      style={{ transformBox: "fill-box", transformOrigin: origin, transform: `scaleX(${ratio})` }}
    />
  )
}

export const PopulationPyramid = memo(PopulationPyramidView)
