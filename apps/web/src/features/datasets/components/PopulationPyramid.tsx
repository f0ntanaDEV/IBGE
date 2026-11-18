import { memo, useEffect, useMemo, useState } from "react"
import type { PyramidRow } from "@/features/datasets/api"
import { YEAR_MAX, YEAR_MIN, calendarYear, countOf, rowsForYear, startAge, toPyramidChart } from "@/features/datasets/derive"
import { HeldTip, TipList } from "@/components/ui/chart"
import { motionVars, useMotion } from "@/motion/useMotion"
import { useFormatter } from "@/hooks/useFormatter"
import { formatAgeBand } from "@/lib/format"

type Outline = { id: string; label: string; rows: PyramidRow[] }

type PopulationPyramidProps = {
  rows: PyramidRow[]
  catalog?: PyramidRow[]
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

function PopulationPyramidView({ rows, catalog, outlines = [], granularity, year, onYear, animate = false, summary }: PopulationPyramidProps) {
  const motion = useMotion()
  const grow = motion.animate ? motionVars(motion) : undefined
  const simple = false
  const formatCount = useFormatter({ key: "populacao", kind: "count" })
  const [playing, setPlaying] = useState(false)
  const [frame, setFrame] = useState(year)
  const [hover, setHover] = useState<{ index: number; x: number; y: number } | null>(null)
  useEffect(() => {
    if (!playing) setFrame(year)
  }, [playing, year])
  const shownYear = catalog?.length ? frame : year
  const viewRows = catalog?.length ? rowsForYear(catalog, shownYear) : rows
  const data = useMemo(() => toPyramidChart(viewRows, outlines), [outlines, viewRows])
  const bars = useMemo(() => [...data].sort((a, b) => startAge(a.faixa) - startAge(b.faixa)), [data])
  const outlineIds = outlines.map((item) => item.id)
  const max = useMemo(() => {
    const values = bars.flatMap((row) =>
      Object.values(row).filter((value): value is number => typeof value === "number").map((value) => Math.abs(value)),
    )
    return Math.max(1, ...values)
  }, [bars])
  const pad = { l: granularity === "idade" ? 48 : 64, r: 28, t: 8, b: 28 }
  const plotW = VB_W - pad.l - pad.r
  const mid = pad.l + plotW / 2
  const maxBar = plotW / 2
  const slot = bars.length ? (VB_H - pad.t - pad.b) / bars.length : 0
  const men = "hsl(var(--chart-1))"
  const women = "hsl(var(--chart-4))"

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setFrame((current) => {
        if (current >= YEAR_MAX) {
          setPlaying(false)
          return current
        }
        return current + 1
      })
    }, PLAY_STEP_MS)
    return () => window.clearInterval(timer)
  }, [playing])

  const total = viewRows.reduce((sum, row) => sum + countOf(row, "Ambos"), 0)
  const hovered = hover == null ? null : bars[hover.index]
  const showBar = (index: number, event: { clientX: number; clientY: number }) => setHover({ index, x: event.clientX, y: event.clientY })

  return (
    <div className="absolute inset-0 flex min-h-0 flex-col gap-2 overflow-y-auto" role="img" aria-label={summary || `Pirâmide de ${formatCount(total)} pessoas em ${shownYear}`}>
      <div className="z-10 flex shrink-0 flex-wrap items-center gap-3 bg-card py-1">
        <label className="flex min-w-48 flex-1 items-center gap-2 text-sm">
          Ano {shownYear}
          {shownYear > calendarYear() ? " (projetado)" : ""}
          <input
            type="range"
            min={YEAR_MIN}
            max={YEAR_MAX}
            value={shownYear}
            aria-valuetext={String(shownYear)}
            onChange={(event) => {
              setPlaying(false)
              const next = Number(event.target.value)
              if (catalog?.length) setFrame(next)
              else onYear(next)
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
              setFrame(YEAR_MIN)
              setPlaying(true)
            }}
          >
            {playing ? "Pausar" : "▶ Reproduzir"}
          </button>
        ) : null}
      </div>
      <div className="relative min-h-0 w-full flex-1 overflow-hidden">
        <p className="pointer-events-none absolute right-2 bottom-1 z-10 text-xs">
          <span style={{ color: men }}>← Homens</span>
          {" | "}
          <span style={{ color: women }}>Mulheres →</span>
        </p>
        {playing ? (
          <p aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center text-7xl font-medium text-foreground/10 tabular-nums">
            {year}
          </p>
        ) : null}
        <HeldTip open={hovered != null && hover != null} x={hover?.x ?? 0} y={hover?.y ?? 0} title={hovered ? formatAgeBand(hovered.faixa) : undefined}>
          {hovered ? (
            <TipList
              rows={[
                { key: "homens", label: "Homens", value: formatCount(Math.abs(hovered.homens)), color: men, suffix: shownYear > calendarYear() ? " (projeção)" : "" },
                { key: "mulheres", label: "Mulheres", value: formatCount(Math.abs(hovered.mulheres)), color: women, suffix: shownYear > calendarYear() ? " (projeção)" : "" },
              ]}
            />
          ) : null}
        </HeldTip>
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="absolute inset-0 h-full w-full">
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
              y={VB_H - 18}
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
              <g key={`meta-${String(row.faixa)}`}>
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
              </g>
            )
          })}
          <g data-anim={grow ? "grow-left" : undefined} style={grow}>
            {bars.map((row, index) => {
              const y = VB_H - pad.b - (index + 1) * slot + slot * 0.15
              const height = Math.max(1, slot * 0.7)
              return (
                <g key={`h-${String(row.faixa)}`} onPointerEnter={(event) => showBar(index, event)} onPointerMove={(event) => showBar(index, event)} onPointerLeave={() => setHover(null)}>
                  <PyramidBar x={mid - maxBar} y={y} width={maxBar} height={height} ratio={Math.abs(row.homens) / max} origin="right center" color={men} outline={false} dashed={false} />
                </g>
              )
            })}
          </g>
          <g data-anim={grow ? "grow-right" : undefined} style={grow}>
            {bars.map((row, index) => {
              const y = VB_H - pad.b - (index + 1) * slot + slot * 0.15
              const height = Math.max(1, slot * 0.7)
              return (
                <g key={`m-${String(row.faixa)}`} onPointerEnter={(event) => showBar(index, event)} onPointerMove={(event) => showBar(index, event)} onPointerLeave={() => setHover(null)}>
                  <PyramidBar x={mid} y={y} width={maxBar} height={height} ratio={Math.abs(row.mulheres) / max} origin="left center" color={women} outline={false} dashed={false} />
                </g>
              )
            })}
          </g>
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
